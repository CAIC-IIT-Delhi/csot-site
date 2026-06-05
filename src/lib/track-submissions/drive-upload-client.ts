/** Browser-only resumable upload to Google Drive (bytes go direct to Google). */

export async function uploadFileToDriveResumable(
  accessToken: string,
  parentFolderId: string,
  file: File,
): Promise<string> {
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: file.name,
        parents: [parentFolderId],
      }),
    },
  );

  if (!initRes.ok) {
    const detail = await initRes.text().catch(() => "");
    throw new Error(
      detail
        ? `Could not start Drive upload (${initRes.status}).`
        : "Could not start Drive upload.",
    );
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Drive did not return an upload URL.");
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Drive upload failed (${uploadRes.status}).`);
  }

  const data = (await uploadRes.json()) as {
    id?: string;
    webViewLink?: string;
  };

  if (data.webViewLink) return data.webViewLink;
  if (data.id) return `https://drive.google.com/file/d/${data.id}/view`;
  throw new Error("Drive upload succeeded but no file link was returned.");
}
