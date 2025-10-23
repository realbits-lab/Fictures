# Bug Fix: Duplicate Replies in Comment Section

## Issue
When adding a reply to a nested comment (reply to reply), the new reply would appear twice in the UI.

## Root Cause
The `handleCommentAdded` function in `CommentSection.tsx` had two problems:

1. **Shallow search**: It only searched for parent comments at the top level using `findIndex`, which couldn't find parent comments that were nested replies
2. **Event bubbling**: The `onCommentAdded` callback was passed down through all nested `CommentItem` components, causing it to be called multiple times for the same new comment

## Solution
Implemented a recursive search function that:

1. **Searches at all depths**: Recursively traverses through all comment levels to find the parent comment
2. **Prevents duplicates**: Checks if a reply with the same ID already exists before adding it
3. **Proper nesting**: Correctly adds the reply to its immediate parent, regardless of nesting depth

## Code Changes

### File: `src/components/reading/CommentSection.tsx`

**Before** (Lines 81-102):
```typescript
const handleCommentAdded = (newComment: Comment) => {
  if (newComment.parentCommentId) {
    setComments((prev) => {
      const updatedComments = [...prev];
      const parentIndex = updatedComments.findIndex(
        (c) => c.id === newComment.parentCommentId
      );

      if (parentIndex !== -1) {
        if (!updatedComments[parentIndex].replies) {
          updatedComments[parentIndex].replies = [];
        }
        updatedComments[parentIndex].replies!.push(newComment);
        updatedComments[parentIndex].replyCount += 1;
      }

      return updatedComments;
    });
  } else {
    setComments((prev) => [newComment, ...prev]);
  }
};
```

**After** (Lines 81-119):
```typescript
const handleCommentAdded = (newComment: Comment) => {
  if (newComment.parentCommentId) {
    setComments((prev) => {
      const updatedComments = [...prev];

      // Recursive function to find and update parent comment at any depth
      const addReplyToParent = (comments: Comment[]): boolean => {
        for (let i = 0; i < comments.length; i++) {
          if (comments[i].id === newComment.parentCommentId) {
            // Found the parent - add the reply
            if (!comments[i].replies) {
              comments[i].replies = [];
            }
            // Check if reply already exists to prevent duplicates
            const alreadyExists = comments[i].replies!.some(r => r.id === newComment.id);
            if (!alreadyExists) {
              comments[i].replies!.push(newComment);
              comments[i].replyCount += 1;
            }
            return true;
          }

          // Search in nested replies
          if (comments[i].replies && comments[i].replies!.length > 0) {
            if (addReplyToParent(comments[i].replies!)) {
              return true;
            }
          }
        }
        return false;
      };

      addReplyToParent(updatedComments);
      return updatedComments;
    });
  } else {
    setComments((prev) => [newComment, ...prev]);
  }
};
```

## How It Works

1. When a new reply is added, `handleCommentAdded` is called with the new comment
2. If the comment has a `parentCommentId`, the recursive `addReplyToParent` function is called
3. The function searches through all comments and their nested replies
4. When it finds the parent comment (matching `id === parentCommentId`):
   - Checks if the reply already exists (prevents duplicates)
   - If not, adds the reply to the parent's `replies` array
   - Increments the parent's `replyCount`
   - Returns `true` to stop searching
5. If the parent isn't found at current level, recursively searches nested replies

## Testing

To test the fix:

1. Navigate to a story's reading page: `http://localhost:3000/reading/[storyId]`
2. Post a comment
3. Reply to that comment (first level reply)
4. Reply to the reply (nested reply)
5. Verify that each reply appears only once in the UI

## Example Flow

```
Comment A (depth 0)
  └─ Reply B (depth 1, parent: A)
      └─ Reply C (depth 2, parent: B)  ← This would duplicate before fix
```

Before the fix:
- Reply C would appear twice under Reply B

After the fix:
- Reply C appears only once under Reply B

## Related Files

- `src/components/reading/CommentSection.tsx` - Main fix location
- `src/components/reading/CommentItem.tsx` - Passes `onCommentAdded` callback
- `src/components/reading/CommentForm.tsx` - Calls `onSuccess` with new comment

## Date
2025-10-23

## Status
✅ Fixed and tested
