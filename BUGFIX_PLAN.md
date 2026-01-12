# Bug Fixes for Phase 2 Deployment

## Issues Identified from User Testing

### 1. Host Video Not Showing ✅
**Issue**: User cannot see themselves (host) in broadcast
**Root Cause**: Host view only shows static avatar image, no webcam feed
**Fix**: Add host webcam feed to broadcast view

### 2. Circular Border Issues ✅
**Issue**: Circular border covers features and looks unprofessional
**Current**: `rounded-full` (perfect circle)
**Fix**: Change to `rounded-2xl` (rounded rectangle)

### 3. Virtual Background Not Working ✅
**Issue**: Background removal not applying during recording
**Root Cause**: VirtualStudio component may not be receiving correct stream
**Fix**: Verify stream connection and background processing

### 4. Content Sharing - Image Scaling ✅
**Issue**: Images are cut off and not scaled to fit screen
**Current**: `max-w-full max-h-full object-contain`
**Fix**: Use proper aspect ratio handling and ensure full visibility

### 5. Document Viewer Missing ✅
**Issue**: PDFs and documents don't open, only show icon
**Fix**: Implement PDF.js viewer for documents

### 6. Video Preview Too Small ✅
**Issue**: Shared video preview is tiny
**Fix**: Make video player larger and add proper controls

### 7. Segmented Replay Bar Not Working ✅
**Issue**: Timeline is not segmented by topics, appears as single bar
**Current**: Creates segments from message pairs
**Fix**: Segments ARE working but need visual separation (see US-012 implementation)

### 8. Cinematic View Too Wide ✅
**Issue**: Video displays in ultra-wide cinematic format
**Requested**: YouTube-style 16:9 aspect ratio
**Fix**: Change from landscape cinematic to standard 16:9

## Implementation Order

1. Change circular borders to rounded rectangles (quick win)
2. Fix image scaling in content sharing
3. Add host webcam feed to broadcast
4. Implement document viewer with PDF.js
5. Fix video preview size
6. Change video aspect ratio from cinematic to 16:9
7. Create test resources folder with sample files
8. Verify virtual background is working

## Files to Modify

- `frontend-web/src/App.tsx` - Main recording view
- `frontend-web/src/components/SessionDetail.tsx` - Replay view
- `frontend-web/src/components/ContentShareModal.tsx` - If needed for better UX
- Create `frontend-web/public/test-resources/` folder

