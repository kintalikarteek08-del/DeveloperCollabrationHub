import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Link2,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';

const AVATAR_STYLES = [
  { id: 'bottts', label: 'Robots' },
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'lorelei', label: 'Modern Art' },
  { id: 'personas', label: 'Personas' },
  { id: 'fun-emoji', label: 'Emoji' },
];

const PRESET_SEEDS = [
  'Atlas', 'Pixel', 'Nova', 'Cyber', 'Echo', 'Vortex', 'Orion', 'Helix'
];

/**
 * Resizes and compresses an image file using an offscreen HTML5 canvas
 * Keeps MongoDB documents light and renders fast without third-party services.
 */
const compressImageFile = (file, maxWidth = 512, maxHeight = 512, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const ProfileImageUploader = ({
  currentImage,
  userName = 'Developer',
  onChange,
  onSaveDirectly = null,
  isSaving = false,
}) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'presets' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bottts');
  const fileInputRef = useRef(null);

  const fallbackDefault = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    userName || 'dev'
  )}`;

  const activeImage = currentImage || fallbackDefault;

  // Handle local image file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    // Limit initial file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB. Please choose a smaller picture.');
      return;
    }

    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressImageFile(file, 512, 512, 0.85);
      onChange(compressedDataUrl);
    } catch (err) {
      console.error('[Image Upload Error]', err);
      setUploadError('Failed to process image. Please try another file.');
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle URL input
  const handleApplyUrl = () => {
    setUrlError('');
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Please enter an image URL');
      return;
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      setUrlError('URL must start with http:// or https://');
      return;
    }

    onChange(trimmed);
  };

  // Generate random avatar
  const handleGenerateRandom = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${randomSeed}`;
    onChange(newAvatar);
  };

  // Reset to default
  const handleResetToDefault = () => {
    onChange(fallbackDefault);
  };

  return (
    <div className="space-y-5">
      {/* Current Preview Header */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-surface-900/70 border border-surface-700/60">
        <div className="relative group">
          <img
            src={activeImage}
            alt="Profile Avatar Preview"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-brand-500/40 shadow-xl shadow-brand-500/10 transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = fallbackDefault;
            }}
          />
          <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-brand-500 text-white shadow-md">
            <Check className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="text-center sm:text-left flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-surface-100 flex items-center justify-center sm:justify-start gap-1.5">
            <ImageIcon className="w-4 h-4 text-brand-400" />
            Profile Picture
          </h4>
          <p className="text-xs text-surface-400">
            Upload a custom photo, pick an avatar preset, or paste a link.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              Reset to Default
            </button>

            {onSaveDirectly && (
              <button
                type="button"
                onClick={onSaveDirectly}
                disabled={isSaving}
                className="text-[11px] px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium shadow-xs transition-colors flex items-center gap-1"
              >
                {isSaving ? 'Saving...' : 'Save Picture Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-surface-900 border border-surface-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'upload'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Image
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'presets'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Dev Avatars
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'url'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Image URL
        </button>
      </div>

      {/* Tab Content: Upload File */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
            id="profile-image-upload-input"
          />

          <label
            htmlFor="profile-image-upload-input"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-surface-700 hover:border-brand-500 rounded-2xl bg-surface-900/40 hover:bg-surface-900/80 transition-all cursor-pointer group text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-surface-800 group-hover:bg-brand-500/20 text-surface-400 group-hover:text-brand-300 flex items-center justify-center mb-2.5 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-surface-200 group-hover:text-white">
              {isProcessing ? 'Processing image...' : 'Click to browse or drag & drop'}
            </p>
            <p className="text-[11px] text-surface-400 mt-1">
              Supports JPEG, PNG, WebP (Auto-optimized for fast loading)
            </p>
          </label>

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Presets / Random Generator */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedStyle === st.id
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                      : 'bg-surface-800 text-surface-400 hover:text-surface-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerateRandom}
              className="text-xs px-3 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/40 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Randomize
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PRESET_SEEDS.map((seed) => {
              const previewUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(
                seed
              )}`;
              const isCurrent = currentImage === previewUrl;

              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => onChange(previewUrl)}
                  className={`p-1.5 rounded-xl border transition-all hover:scale-105 relative ${
                    isCurrent
                      ? 'border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/40'
                      : 'border-surface-700 bg-surface-900/60 hover:border-surface-600'
                  }`}
                  title={`Select avatar ${seed}`}
                >
                  <img
                    src={previewUrl}
                    alt={seed}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  {isCurrent && (
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: URL Input */}
      {activeTab === 'url' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or GitHub avatar URL"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError('');
              }}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-surface-100 text-xs focus:border-brand-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              Apply URL
            </button>
          </div>

          {urlError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}

          <p className="text-[11px] text-surface-500">
            Tip: You can use your GitHub profile photo by entering{' '}
            <code className="text-brand-300">https://github.com/your-username.png</code>
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUploader;
