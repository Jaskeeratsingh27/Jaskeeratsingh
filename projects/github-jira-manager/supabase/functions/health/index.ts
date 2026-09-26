Deno.serve(() => {
  return Response.json({
    status: "ok",
    service: "github-jira-manager",
    runtime: "supabase-edge-functions",
    version: "1.4.x",
  });
});
