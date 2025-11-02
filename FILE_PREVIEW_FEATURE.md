# File Preview Feature for Admin Dashboard

## Overview

Added a comprehensive file preview system that allows administrators to view submitted papers (PDF, images, documents) directly in the admin panel before approving or rejecting them. This eliminates the need to download files locally to review submissions.

---

## Features Added

### 1. **File Preview Modal Component**
- **Location**: `frontend/src/components/FilePreviewModal.tsx`
- **Functionality**:
  - Preview images (JPG, PNG, GIF) directly in the browser
  - Display PDF files with embedded PDF viewer
  - Show document icons for unsupported formats with download option
  - Full-screen modal with close button
  - Download button for saving files locally

### 2. **Admin Dashboard Integration**
- **Location**: `frontend/src/components/AdminDashboard.tsx`
- **Added Components**:
  - "View" button on each pending paper card
  - Modal state management for file preview
  - Integration with existing Approve/Reject workflow

### 3. **Backend Enhancements**
- **File**: `main.py`
- **Changes**:
  - Added `file_path` to `PaperResponse` Pydantic model
  - Updated `format_paper_response()` function to include file path
  - Existing `/papers/{paper_id}/download` endpoint used for viewing

---

## How It Works

### Admin Workflow

1. **View Pending Papers**
   - Navigate to "pending" tab in Admin Dashboard
   - See list of submitted papers with metadata

2. **Preview File**
   - Click the blue "View" button on any paper
   - Modal opens showing the file preview
   - Supported file types:
     - **Images**: JPG, JPEG, PNG, GIF (displayed directly)
     - **PDF**: Shows embedded PDF viewer
     - **Documents**: DOC, DOCX (shows file icon with download option)

3. **Review & Action**
   - Review file content
   - Close modal and click "Approve" or "Reject"
   - Can still download file if needed

### File Preview Capabilities

| File Type | Preview Method | Status |
|-----------|----------------|--------|
| JPG, JPEG, PNG, GIF | Direct image display | ✅ Working |
| PDF | Embedded PDF viewer | ✅ Working |
| DOC, DOCX | Document icon + download | ✅ Working |
| Other files | File icon + download | ✅ Working |

---

## Component Details

### FilePreviewModal Component

**Props:**
```typescript
interface FilePreviewModalProps {
  isOpen: boolean;           // Control modal visibility
  onClose: () => void;       // Callback to close modal
  fileName: string;          // Name of the file
  filePath: string;          // Path to the file on server
  paperId: number;           // Paper ID for download
  token: string;             // Auth token for API calls
}
```

**Features:**
- Responsive design that works on all screen sizes
- Dark mode support
- Smooth animations with Framer Motion
- Error handling for preview failures
- Download functionality with proper file naming

### Integration with AdminDashboard

**State Management:**
```typescript
const [previewModal, setPreviewModal] = useState({
  isOpen: false,
  fileName: '',
  filePath: '',
  paperId: 0
});
```

**Usage:**
```typescript
// Open preview modal
onClick={() => setPreviewModal({
  isOpen: true,
  fileName: paper.file_name,
  filePath: paper.file_path,
  paperId: paper.id
})}

// Close preview modal
onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
```

---

## Backend API Changes

### Updated PaperResponse Schema

```python
class PaperResponse(BaseModel):
    id: int
    course_id: int
    course_code: Optional[str]
    course_name: Optional[str]
    uploader_name: Optional[str]
    uploader_email: Optional[str]
    title: str
    description: Optional[str]
    paper_type: PaperType
    year: Optional[int]
    semester: Optional[str]
    file_name: str
    file_path: str  # NEW: Added for frontend preview
    file_size: Optional[int]
    status: SubmissionStatus
    uploaded_at: datetime
    reviewed_at: Optional[datetime]
    rejection_reason: Optional[str]
```

### Affected Endpoints

All endpoints that return `PaperResponse` now include `file_path`:

- `GET /papers/pending` - Get pending papers (admin)
- `GET /papers` - Get papers with filters
- `GET /papers/{paper_id}` - Get specific paper
- `POST /papers/upload` - Upload paper

### Download Endpoint

**Existing endpoint used for file retrieval:**
```
GET /papers/{paper_id}/download
Headers: Authorization: Bearer {token}
```

Returns the actual file for download with proper MIME type.

---

## Usage Examples

### Typical Admin Workflow

1. **Login as admin**
   ```
   Email: admin@university.edu
   Password: admin123
   ```

2. **Go to Pending Papers Tab**
   - Click "pending" tab in admin dashboard
   - See all papers waiting for review

3. **Review a Paper**
   - Click "View" button (blue eye icon)
   - Modal opens showing the file
   - Review content carefully

4. **Make Decision**
   - Click "Approve" button (green checkmark)
   - OR click "Reject" button (red X) and enter reason
   - Paper is marked as reviewed

### File Preview Features

**Image Preview:**
- Full-size image display
- Zoom capabilities (browser default)
- Download option

**PDF Preview:**
- Embedded PDF viewer
- Page navigation
- Search and text selection (if enabled)
- Download option

**Document Files:**
- File icon display
- File name shown
- Download button for opening in native application

---

## Technical Implementation

### Frontend Stack
- **React 19** with TypeScript
- **Framer Motion** for animations
- **Lucide Icons** for UI elements
- **Axios** for API calls

### Key Features

1. **Error Handling**
   - Graceful fallback if preview fails
   - "Preview not available" message with download option
   - Network error handling

2. **Security**
   - Token-based authentication on all requests
   - File access validation on backend
   - CORS middleware enabled

3. **Performance**
   - Lazy loading of file contents
   - Efficient modal animations
   - No unnecessary re-renders

4. **Accessibility**
   - Keyboard navigation support
   - ARIA labels for screen readers
   - Clear visual hierarchy

---

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx        (Updated)
│   │   └── FilePreviewModal.tsx      (New)
│   ├── contexts/
│   ├── utils/
│   └── ...
```

```
backend/
├── main.py                          (Updated)
└── ...
```

---

## Configuration

### Environment Variables
No new environment variables required. Uses existing:
- `API_BASE_URL`: Backend URL (default: `http://localhost:8000`)

### File Support
Supported file types can be modified in `FilePreviewModal.tsx`:

```typescript
const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');
const isPdf = fileExtension === 'pdf';
const isDocument = ['doc', 'docx'].includes(fileExtension || '');
```

---

## Testing Guide

### Manual Testing Checklist

1. **Preview Image Files**
   - [ ] Upload JPG file
   - [ ] Upload PNG file
   - [ ] Click View button
   - [ ] Image displays correctly
   - [ ] Close modal works
   - [ ] Download button works

2. **Preview PDF Files**
   - [ ] Upload PDF file
   - [ ] Click View button
   - [ ] PDF displays in viewer
   - [ ] Can navigate pages (if multi-page)
   - [ ] Close modal works
   - [ ] Download button works

3. **Preview Document Files**
   - [ ] Upload DOC file
   - [ ] Upload DOCX file
   - [ ] Click View button
   - [ ] Document icon shows
   - [ ] Download button works
   - [ ] Downloaded file opens correctly

4. **Approval Workflow**
   - [ ] Preview paper
   - [ ] Click Approve while viewing
   - [ ] Paper status updates
   - [ ] Pending list refreshes

5. **Rejection Workflow**
   - [ ] Preview paper
   - [ ] Close modal
   - [ ] Click Reject
   - [ ] Enter rejection reason
   - [ ] Paper status updates
   - [ ] Rejection reason visible to student

6. **Edge Cases**
   - [ ] Corrupted file preview
   - [ ] Very large file handling
   - [ ] Network error during preview
   - [ ] Token expiration during preview

---

## Troubleshooting

### Preview Not Displaying

**Issue**: Modal opens but file doesn't preview

**Solutions:**
1. Check file format is supported
2. Verify file exists on server
3. Check browser console for errors
4. Try downloading file instead
5. Restart backend server

### Download Fails

**Issue**: Download button returns error

**Solutions:**
1. Verify token is valid
2. Check file permissions on server
3. Ensure uploads/ directory exists
4. Check disk space availability

### Modal Won't Close

**Issue**: Close button not working

**Solutions:**
1. Refresh page (Ctrl+R)
2. Press Escape key (if implemented)
3. Click outside modal (already enabled)

### File Path Issues

**Issue**: File path not sent from backend

**Solutions:**
1. Verify `file_path` added to PaperResponse model
2. Restart backend after changes
3. Check database contains file_path values
4. Verify backend version is updated

---

## Future Enhancements

### Planned Features
1. **Zoom Controls** for image preview
2. **Annotation Tools** to mark issues in PDFs
3. **Multiple File Support** (zip downloads)
4. **File Comparison** between revisions
5. **Real-time Collaboration** (comments on files)
6. **Video Preview** for submitted video files
7. **Audio Preview** for audio files
8. **Text Search** across PDF documents

### Performance Improvements
1. Caching file previews
2. Lazy loading large files
3. Compression for image preview
4. Service worker for offline preview

### Security Enhancements
1. Watermark documents
2. Disable download for certain file types
3. Track file access logs
4. Prevent copy-paste for sensitive files

---

## API Response Example

### GET /papers/pending
```json
[
  {
    "id": 1,
    "title": "Midterm Exam",
    "file_name": "exam_submission.pdf",
    "file_path": "uploads/1730570400.123_exam_submission.pdf",
    "file_size": 2048576,
    "paper_type": "midterm",
    "course_code": "CS1108",
    "course_name": "Python Programming",
    "uploader_name": "John Doe",
    "uploader_email": "john@university.edu",
    "status": "pending",
    "uploaded_at": "2025-11-02T10:30:00",
    "year": 2025,
    "semester": "Fall 2025"
  }
]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-02 | Initial file preview implementation |

---

## Support

For issues or questions about the file preview feature:
1. Check this documentation first
2. Review error messages in browser console
3. Check backend logs for server errors
4. Verify file permissions and formats
5. Test with different file types

