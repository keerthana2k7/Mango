import React, { useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { ImageRecord } from '../types';

interface ImageGalleryPageProps {
  images: ImageRecord[];
  onUploadImage: (file: File) => void;
}

export const ImageGalleryPage: React.FC<ImageGalleryPageProps> = ({ images, onUploadImage }) => {
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Leaf Image Repository</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Foliar imagery captured by automated rail camera and mobile field scouting.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold cursor-pointer shadow-md transition">
          <Upload size={14} />
          <span>Upload Leaf Sample</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {images.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <ImageIcon size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-500">No leaf images captured yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Run camera simulation or upload a leaf photo to trigger ML diagnosis.</p>
          </div>
        ) : (
          images.map((img) => {
            return (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden hover:shadow-float transition duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img
                    src={`http://localhost:8000/storage/${img.file_path}`}
                    alt="Mango Leaf"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      // Fallback synthetic graphic
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/60 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    Tree #{img.tree_id}
                  </div>
                </div>

                <div className="p-4 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Captured</span>
                    <span className="font-semibold text-slate-800">{new Date(img.capture_time).toLocaleDateString()}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {img.processing_status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden p-6 border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Leaf Inspection Lightbox</h3>
            <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-video mb-4 flex items-center justify-center">
              <img
                src={`http://localhost:8000/storage/${selectedImage.file_path}`}
                alt="Enlarged Leaf"
                className="max-h-full object-contain"
              />
            </div>
            <div className="text-xs space-y-1 text-slate-600 mb-4">
              <p><span className="font-bold text-slate-900">Tree Association:</span> Tree #{selectedImage.tree_id}</p>
              <p><span className="font-bold text-slate-900">Capture Source:</span> {selectedImage.image_type}</p>
              <p><span className="font-bold text-slate-900">Capture Timestamp:</span> {new Date(selectedImage.capture_time).toLocaleString()}</p>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
