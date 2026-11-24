DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.nilai
    WHERE id_sesi IS NOT NULL
    GROUP BY id_sesi
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'nilai contains duplicate id_sesi values. Resolve those duplicates before enabling automatic exam finalization.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS nilai_id_sesi_unique
  ON public.nilai (id_sesi);

CREATE OR REPLACE FUNCTION public.ensure_sesi_ujian_deadline()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.deadline_at IS NULL THEN
    NEW.deadline_at :=
      statement_timestamp()
      + make_interval(secs => GREATEST(COALESCE(NEW.sisa_waktu, 0), 0));
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.sesi_ujian
SET deadline_at =
  COALESCE(updated_at, created_at, statement_timestamp())
  + make_interval(secs => GREATEST(COALESCE(sisa_waktu, 0), 0))
WHERE deadline_at IS NULL;

DROP TRIGGER IF EXISTS sesi_ujian_ensure_deadline
  ON public.sesi_ujian;

CREATE TRIGGER sesi_ujian_ensure_deadline
BEFORE INSERT OR UPDATE OF deadline_at, sisa_waktu
ON public.sesi_ujian
FOR EACH ROW
EXECUTE FUNCTION public.ensure_sesi_ujian_deadline();

CREATE OR REPLACE FUNCTION public.finalize_expired_exams()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  finalized_count integer;
BEGIN
  WITH expired_sessions AS (
    SELECT
      s.id_sesi,
      s.username_siswa,
      s.id_ujian,
      s.status AS session_status,
      COALESCE(s.jawaban_sementara, '{}'::jsonb) AS answers,
      j.mapel,
      u.nama,
      u.kelas
    FROM public.sesi_ujian AS s
    JOIN public.jadwal AS j
      ON j.id::text = s.id_ujian
    JOIN LATERAL (
      SELECT users.nama, users.kelas
      FROM public.users
      WHERE users.username = s.username_siswa
      ORDER BY users.id
      LIMIT 1
    ) AS u ON true
    WHERE s.deadline_at IS NOT NULL
      AND s.deadline_at <= statement_timestamp()
      AND NOT EXISTS (
        SELECT 1
        FROM public.nilai AS existing_result
        WHERE existing_result.id_sesi = s.id_sesi
      )
  ),
  question_results AS (
    SELECT
      e.id_sesi,
      q.id AS question_id,
      q.pertanyaan,
      COALESCE(e.answers ->> q.id::text, '') AS student_answer,
      upper(btrim(COALESCE(q.jawaban_benar, ''))) AS correct_answer,
      CASE
        WHEN btrim(COALESCE(e.answers ->> q.id::text, '')) <> ''
          AND upper(btrim(COALESCE(e.answers ->> q.id::text, '')))
            = upper(btrim(COALESCE(q.jawaban_benar, '')))
        THEN true
        ELSE false
      END AS is_correct,
      CASE
        WHEN COALESCE(q.poin, 0) = 0 THEN 2::numeric
        ELSE q.poin
      END AS points
    FROM expired_sessions AS e
    JOIN public.soal AS q
      ON upper(COALESCE(q.mapel, '')) = upper(COALESCE(e.mapel, ''))
      AND (
        btrim(COALESCE(q.kelas, '')) = ''
        OR upper(q.kelas) LIKE '%SEMUA%'
        OR EXISTS (
          SELECT 1
          FROM unnest(string_to_array(upper(COALESCE(q.kelas, '')), ',')) AS target(kelas)
          WHERE btrim(target.kelas) IN (
            upper(btrim(COALESCE(e.kelas, ''))),
            btrim(
              split_part(upper(COALESCE(e.kelas, '')), ' ', 1)
              || ' '
              || split_part(upper(COALESCE(e.kelas, '')), ' ', 2)
            ),
            split_part(upper(COALESCE(e.kelas, '')), ' ', 2),
            split_part(upper(COALESCE(e.kelas, '')), ' ', 1)
          )
        )
      )
  ),
  scored_sessions AS (
    SELECT
      e.id_sesi,
      e.username_siswa,
      e.id_ujian,
      e.session_status,
      e.nama,
      e.kelas,
      e.mapel,
      count(q.question_id)::integer AS total_soal,
      (count(*) FILTER (WHERE q.is_correct))::integer AS benar,
      COALESCE(sum(q.points) FILTER (WHERE q.is_correct), 0)::numeric AS skor,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'tanya', q.pertanyaan,
            'jawab_siswa', q.student_answer,
            'kunci', q.correct_answer
          )
          ORDER BY q.question_id
        ) FILTER (WHERE q.question_id IS NOT NULL),
        '[]'::jsonb
      )::text AS detail_jawaban
    FROM expired_sessions AS e
    LEFT JOIN question_results AS q
      ON q.id_sesi = e.id_sesi
    GROUP BY
      e.id_sesi,
      e.username_siswa,
      e.id_ujian,
      e.session_status,
      e.nama,
      e.kelas,
      e.mapel
  ),
  saved_results AS (
    INSERT INTO public.nilai (
      nama_siswa,
      kelas,
      mapel,
      skor,
      benar,
      salah,
      total_soal,
      status,
      detail_jawaban,
      id_sesi,
      username_siswa,
      id_ujian
    )
    SELECT
      s.nama,
      s.kelas,
      s.mapel,
      round(s.skor, 2),
      s.benar,
      s.total_soal - s.benar,
      s.total_soal,
      CASE
        WHEN upper(COALESCE(s.session_status, '')) IN ('DISQUALIFIED', 'DISKUALIFIKASI')
          THEN 'Diskualifikasi'
        ELSE 'Selesai'
      END,
      s.detail_jawaban,
      s.id_sesi,
      s.username_siswa,
      s.id_ujian
    FROM scored_sessions AS s
    ON CONFLICT (id_sesi) DO NOTHING
    RETURNING id_sesi
  )
  SELECT count(*)::integer
  INTO finalized_count
  FROM saved_results;

  RETURN finalized_count;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_expired_exams() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_expired_exams() FROM anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  FOR existing_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'cbt-finalize-expired-exams'
  LOOP
    PERFORM cron.unschedule(existing_job_id);
  END LOOP;

  PERFORM cron.schedule(
    'cbt-finalize-expired-exams',
    '* * * * *',
    'SELECT public.finalize_expired_exams();'
  );
END;
$$;
