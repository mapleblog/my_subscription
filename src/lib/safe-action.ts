
import { createSafeActionClient } from "next-safe-action";
import { logger } from "@/lib/logger";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    logger.error("SERVER_ACTION_ERROR", e);
    
    // In production, mask the error message
    if (e instanceof Error) {
      return {
        message: e.message, // Or generic message
      };
    }
    
    return {
      message: "An unexpected error occurred.",
    };
  },
});
