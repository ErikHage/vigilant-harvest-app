/**
 * The services' status codes the suite relies on, re-declared rather than
 * imported, so a changed code breaks a test instead of silently agreeing
 * with it.
 */
export const status = {
    ok: 200,
    created: 201,
    noContent: 204,
    // A delete refused while something else still holds the row
    conflict: 409,
    // What the suite answers for the app, to see how a page takes a failure
    serverError: 500,
};
