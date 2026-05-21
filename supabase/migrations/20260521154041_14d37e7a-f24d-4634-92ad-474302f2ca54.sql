-- Allow anonymous review submissions (always unpublished, requires moderation)
CREATE POLICY "anyone can submit review"
ON public.reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (
  is_published = false
  AND rating BETWEEN 1 AND 5
  AND length(coalesce(text, '')) BETWEEN 10 AND 4000
  AND length(coalesce(author_name, '')) BETWEEN 2 AND 200
  AND (company IS NULL OR length(company) <= 200)
);