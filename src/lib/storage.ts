import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads a file to a private bucket and returns a long-lived signed URL. */
export async function uploadImage(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("Could not sign URL");
  return data.signedUrl;
}

/** Uploads a payment proof (anon allowed) and returns the storage path. */
export async function uploadPaymentProof(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `proofs/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("payment-proofs").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
