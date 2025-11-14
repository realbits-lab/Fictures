/**
 * Validation request types for API endpoints
 */

export interface ValidationRequest {
    type:
        | "story"
        | "part"
        | "chapter"
        | "scene"
        | "character"
        | "setting"
        | "full";
    data: any;
    includeWarnings?: boolean;
}
