import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface OrderNote {
    noteId: number;
    orderId: number;
    orderNumber: string;
    contentHtml: string;
    createdByAdmin: string;
    createdUtc: string;
    isSystemLog: boolean;
}

interface OrderNotesModalProps {
    orderId: number;
    orderNumber: string;
    onClose: () => void;
}

export const OrderNotesModal: React.FC<OrderNotesModalProps> = ({ orderId, orderNumber, onClose }) => {
    const [notes, setNotes] = useState<OrderNote[]>([]);
    const [loading, setLoading] = useState(true);

    // --- CONNECT CONTROLLED RICH TEXT STATE ---
    const [noteText, setNoteText] = useState<string>('');
    const currentAdmin = "Admin_Vladimir";

    const fetchNotes = async () => {
        try {
            const response = await fetch(`http://localhost:5201/api/ordernotes/order/${orderId}`);
            const data = await response.json();
            setNotes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [orderId]);

    const handleCreateNoteSubmit = async () => {
        // Enforce basic validation guards on incoming string lengths
        if (!noteText || noteText.trim() === "" || noteText === "<br>") return;

        try {
            const response = await fetch('http://localhost:5201/api/ordernotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, contentHtml: noteText, isSystemLog: false })
            });
            if (response.ok) {
                setNoteText(''); // Flush text state upon approval
                fetchNotes();
            }
        } catch (err) {
            alert(err);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm("Are you confident you want to delete this specific communication note file row?")) return;
        try {
            const response = await fetch(`http://localhost:5201/api/ordernotes/${noteId}`, { method: 'DELETE' });
            if (response.ok) fetchNotes();
            else {
                const errData = await response.json();
                alert(errData.error || "Access Denied.");
            }
        } catch (err) {
            alert(err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[85vh] flex flex-col relative z-10 border border-gray-100 animate-in zoom-in-95 duration-200">

                {/* Header Block */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                    <div>
                        <h2 className="text-md font-black text-gray-900 font-mono tracking-tight">Ledger Workspace Notes: {orderNumber}</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Secure, audited communication logs matching transaction profile tracks.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold p-1">✕</button>
                </div>

                {/* Dynamic Timeline Stream Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/20">
                    {loading ? (
                        <p className="text-center text-xs text-gray-400 animate-pulse py-8">Hydrating notes history logs...</p>
                    ) : notes.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-12">No notations attached to this file index line yet.</p>
                    ) : (
                        notes.map((note) => {
                            const isOwner = note.createdByAdmin === currentAdmin;
                            return (
                                <div
                                    key={note.noteId}
                                    className={`p-4 rounded-xl border transition-all ${note.isSystemLog
                                        ? 'bg-indigo-50/30 border-indigo-100/70 text-indigo-950 shadow-sm/30'
                                        : 'bg-white border-gray-100/80 text-gray-800 shadow-sm/40'
                                        }`}
                                >
                                    <div className="flex items-center justify-between border-b border-gray-100/60 pb-2 mb-2.5">
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${note.isSystemLog ? 'bg-indigo-100 text-indigo-700 font-sans' : 'bg-gray-100 text-gray-600 font-mono'
                                                }`}>
                                                {note.createdByAdmin}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{new Date(note.createdUtc).toLocaleString()}</span>
                                        </div>
                                        {isOwner && !note.isSystemLog && (
                                            <button
                                                onClick={() => handleDeleteNote(note.noteId)}
                                                className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                            >
                                                Remove Note
                                            </button>
                                        )}
                                    </div>

                                    {/* Rich Text Output Box Anchor */}
                                    <div
                                        className="text-xs leading-relaxed prose prose-sm max-w-none break-words"
                                        dangerouslySetInnerHTML={{ __html: note.contentHtml }}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- UPGRADED SELF-HOSTED RICH TEXT CREATOR DOCK --- */}
                <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl space-y-3">
                    <Editor
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        value={noteText}
                        init={{
                            license_key: 'gpl',
                            height: 180,
                            menubar: false,
                            plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | link image media | removeformat | help',

                            // ⚡ ENFORCED LOCAL BASE MAPPINGS
                            base_url: '/tinymce',
                            suffix: '.min',
                            skin: 'oxide',
                            theme: 'silver', // Explicitly declare the layout theme engine
                            model: 'dom',    // Explicitly anchor the document model mapper

                            content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:12px }',
                            promotion: false, // Disables the "Upgrade" link banner
                            branding: false,  // Disables the TinyMCE watermark footprint
                        }}
                        onEditorChange={(newHtmlContent) => {
                            setNoteText(newHtmlContent);
                        }}
                    />

                    <div className="flex justify-end pt-1">
                        <button
                            onClick={handleCreateNoteSubmit}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                            Commit Audited Log Entry
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};