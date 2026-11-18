type LinkedInPublishInput = {
  accessToken: string;
  personId: string;
  content: string;
};

export async function publishLinkedInTextPost(input: LinkedInPublishInput) {
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": process.env.LINKEDIN_API_VERSION || "202611",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${input.personId}`,
      commentary: input.content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
    cache: "no-store",
  });

  const responseText = await response.text();
  if (!response.ok) {
    let message = `LinkedIn rejected the post (${response.status}).`;
    try {
      const payload = JSON.parse(responseText) as { message?: string };
      if (payload.message) message = payload.message;
    } catch { /* LinkedIn occasionally returns an empty or non-JSON error body. */ }
    throw new Error(message);
  }

  let responseId = response.headers.get("x-restli-id");
  if (!responseId && responseText) {
    try {
      const payload = JSON.parse(responseText) as { id?: string };
      responseId = payload.id ?? null;
    } catch { /* A successful response may have no body. */ }
  }
  if (!responseId) throw new Error("LinkedIn published the post but did not return its identifier.");
  return { providerPostId: responseId };
}
