import React, { useState, useRef, ChangeEvent } from 'react';
import { ImageData } from './types';
import { fileToImageData, addWatermark } from './utils/fileUtils';
import { generateOrEditImage } from './services/geminiService';

// --- HEADER ---
const Header: React.FC = () => (
  <header className="w-full max-w-5xl mx-auto p-4 mb-4">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
        T H A R A
      </h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
        Ai Image <span className="text-pink-500">Creator</span>
      </h2>
      <p className="mt-2 text-lg text-gray-600">Bring your creative visions to life with a single prompt.</p>
    </div>
  </header>
);

// --- IMAGE UPLOADER ---
interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  onRemoveImage: () => void;
  imagePreviewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onRemoveImage, imagePreviewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageData = await fileToImageData(file);
        onImageUpload(imageData);
      } catch (error) {
        console.error("Error converting file:", error);
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        try {
            const imageData = await fileToImageData(file);
            onImageUpload(imageData);
        } catch (error) {
            console.error("Error converting file:", error);
        }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="w-full h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div
        className="relative w-full h-full border-4 border-dashed border-pink-200 rounded-2xl flex flex-col justify-center items-center text-center p-4 cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all duration-300"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {imagePreviewUrl ? (
          <>
            <img src={imagePreviewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain rounded-xl p-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage();
              }}
              className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full p-1.5 shadow-md transition-all duration-200"
              aria-label="Remove image"
              title="Remove image"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </>
        ) : (
          <>
            <svg className="w-16 h-16 text-pink-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-gray-600 font-semibold">Drop an image here, or <span className="text-pink-500">browse</span></p>
            <p className="text-sm text-gray-500 mt-1">Supports: JPG, PNG, WEBP</p>
          </>
        )}
      </div>
    </div>
  );
};

// --- LOADER ---
interface LoaderProps {
  message: string;
}
const Loader: React.FC<LoaderProps> = ({ message }) => (
  <div className="w-full h-full flex flex-col justify-center items-center bg-white/50 backdrop-blur-sm rounded-2xl">
    <svg className="animate-spin h-12 w-12 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-lg font-semibold text-gray-700 text-center px-4">{message}</p>
  </div>
);

// --- IMAGE MODAL ---
interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}
const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => (
  <div
    className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      className="relative max-w-full max-h-full"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
    >
      <img src={imageUrl} alt="Full size preview" className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full p-2 hover:scale-110 transition-transform shadow-lg"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
);

// --- FOOTER ---
const Footer: React.FC = () => (
    <footer className="w-full max-w-5xl mx-auto py-6 mt-8 border-t border-gray-200/80">
        <div className="text-center text-sm text-gray-600 space-y-2">
            <p>
                Created by <span className="font-semibold">Tharindu Lakshith</span>. &copy; {new Date().getFullYear()} All Rights Reserved.
            </p>
            <p>
                Need an app like this? Contact me at <a href="tel:+94752725428" className="font-semibold text-blue-600 hover:underline">+94 75 272 5428</a>.
            </p>
        </div>
    </footer>
);

// --- MAIN APP ---
const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const handleUseResultAsInput = () => {
    if (!resultImage) return;

    const mimeType = resultImage.match(/data:(.*);base64,/)?.[1] || 'image/png';
    const base64 = resultImage.split(',')[1];
    
    setSelectedImage({
      base64,
      mimeType,
      url: resultImage,
    });
    setResultImage(null);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setResultImage(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    const fileName = `generated-image-by-thara-${Date.now()}.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const loadingMsg = selectedImage ? 'Applying your creative edits...' : 'Generating your vision...';
      setLoadingMessage(loadingMsg);
      const newImage = await generateOrEditImage(prompt, selectedImage);
      const watermarkedImage = await addWatermark(newImage, "T H A R A");
      setResultImage(watermarkedImage);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = !prompt || isLoading;
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-pink-100 font-sans text-gray-800 flex flex-col items-center p-4">
      <Header />

      <main className="w-full max-w-5xl mx-auto flex-grow flex flex-col items-center">
        <div className="w-full bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column: Input */}
            <div className="flex flex-col space-y-2">
              <h2 className="text-2xl font-bold text-center text-gray-700 mb-2">Start with an Image (Optional)</h2>
              <div className="w-full aspect-square bg-gray-50 rounded-2xl flex justify-center items-center overflow-hidden">
                <ImageUploader 
                  onImageUpload={setSelectedImage} 
                  onRemoveImage={handleRemoveImage}
                  imagePreviewUrl={selectedImage?.url || null} 
                />
              </div>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col space-y-2">
              <h2 className="text-2xl font-bold text-center text-gray-700 mb-2">Generated Result</h2>
              <div className="w-full aspect-square bg-gray-100 rounded-2xl flex justify-center items-center overflow-hidden">
                {isLoading ? (
                  <Loader message={loadingMessage} />
                ) : (
                  <>
                    {resultImage ? (
                      <div 
                        className="relative w-full h-full group cursor-pointer"
                        onClick={() => setModalImageUrl(resultImage)}
                      >
                        <img 
                            src={resultImage} 
                            alt="Generated result" 
                            className="w-full h-full object-contain"
                        />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <p className="text-white text-lg font-semibold">Click to view full size</p>
                         </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUseResultAsInput(); }}
                            className="bg-white/90 backdrop-blur-sm text-gray-800 font-bold py-2 px-4 rounded-full shadow-lg hover:bg-white hover:scale-105 transform transition-all duration-300 ease-in-out flex items-center gap-2"
                          >
                            <span role="img" aria-label="paint palette">🎨</span> Refine
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                            className="bg-blue-500/90 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-blue-600 hover:scale-105 transform transition-all duration-300 ease-in-out flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download
                          </button>
                        </div>
                      </div>
                    ) : <p className="text-gray-500 p-4 text-center">Your creation will appear here</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full flex flex-col items-center space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A robot holding a red skateboard' or 'Make it look like a painting'"
                className="w-full max-w-xl h-28 p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className={`w-full max-w-xl py-3 px-6 text-xl font-bold text-white rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  isSubmitDisabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600'
                }`}
              >
                {isLoading ? 'Creating...' : '✨ Generate'}
              </button>
          </div>
        </div>
      </main>
      
      <Footer />
      {modalImageUrl && <ImageModal imageUrl={modalImageUrl} onClose={() => setModalImageUrl(null)} />}
    </div>
  );
};

export default App;
