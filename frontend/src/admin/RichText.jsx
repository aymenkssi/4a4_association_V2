import React from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const modules = {
    toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "blockquote"],
        ["clean"],
    ],
};

const formats = ["header", "bold", "italic", "underline", "strike", "list", "link", "blockquote"];

const RichText = ({ value, onChange, placeholder, testId }) => {
    return (
        <div className="rich-text-wrapper" data-testid={testId}>
            <ReactQuill theme="snow" value={value || ""} onChange={onChange} modules={modules} formats={formats} placeholder={placeholder} />
        </div>
    );
};

export default RichText;
