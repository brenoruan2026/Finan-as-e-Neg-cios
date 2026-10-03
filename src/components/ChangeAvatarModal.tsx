import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Check,
  RotateCcw,
  User as UserIcon,
  Video,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Modal } from './Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    id: string;
    name: string;
    avatar?: string;
    position?: string;
  };
  onAvatarUpdated?: (newAvatar: string) => void;
}

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onAvatarUpdated,
}) => {
  const { user: currentUser, updateProfile, refreshUser } = useAuth();
  const { success, error, info } = useToast();

  const user = targetUser || currentUser;
  const isSelf = !targetUser || targetUser.id === currentUser?.id;

  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'url' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(user?.avatar || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Camera stream states
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Curated executive portrait presets for Nexora Group
  const executivePresets = [
    {
      id: 'ruan_official',
      name: 'Ruan (Executivo)',
      role: 'CEO & Administrador',
      url: '/src/assets/images/avatar_ruan_1791062648918.jpg',
    },
    {
      id: 'gabriel_official',
      name: 'Gabriel (Executivo)',
      role: 'CTO & Operações',
      url: '/src/assets/images/avatar_gabriel_1791062659434.jpg',
    },
    {
      id: 'cliver_official',
      name: 'Cliver (Executivo)',
      role: 'CFO & Comercial',
      url: '/src/assets/images/avatar_cliver_1791062672397.jpg',
    },
    {
      id: 'monogram_blue',
      name: 'Monograma Nexora',
      role: 'Identidade Corporativa',
      url: generateMonogramUrl(user?.name || 'NEXORA'),
    },
  ];

  // Helper to generate a sleek SVG monogram base64
  function generateMonogramUrl(name: string): string {
    const initials = name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="monoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B192C" />
            <stop offset="50%" stop-color="#003E99" />
            <stop offset="100%" stop-color="#0066FF" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" rx="200" fill="url(#monoGrad)" />
        <circle cx="200" cy="200" r="185" fill="none" stroke="#38BDF8" stroke-width="4" stroke-opacity="0.4" />
        <text x="50%" y="54%" font-family="system-ui, sans-serif" font-size="140" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">
          ${initials || 'NG'}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Update preview when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(user?.avatar || '');
      setUrlInput('');
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, user?.avatar]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(err.message || 'Não foi possível acessar a câmera. Verifique as permissões.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 400;
    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Center crop
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewUrl(dataUrl);
      stopCamera();
      success('Foto capturada pela câmera com sucesso!');
    }
  };

  // Process uploaded image file with crisp client-side square crop/resize
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        // Determine square crop
        const minSide = Math.min(width, height);
        const startX = (width - minSide) / 2;
        const startY = (height - minSide) / 2;

        canvas.width = maxDim;
        canvas.height = maxDim;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setPreviewUrl(dataUrl);
          success('Foto carregada e otimizada! Clique em "Salvar Nova Foto" para confirmar.');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      error('Cole uma URL de imagem válida.');
      return;
    }
    const testImg = new Image();
    testImg.onload = () => {
      setPreviewUrl(urlInput.trim());
      success('URL da imagem validada e aplicada!');
    };
    testImg.onerror = () => {
      error('Não foi possível carregar a imagem deste link. Verifique a URL.');
    };
    testImg.src = urlInput.trim();
  };

  const handleSave = async () => {
    if (!previewUrl) {
      error('Selecione ou envie uma foto para salvar.');
      return;
    }

    try {
      setIsSaving(true);

      if (isSelf) {
        // Update currently logged in partner
        await updateProfile({ avatar: previewUrl });
      } else if (user?.id) {
        // Admin updating another partner / employee
        await api.updateUser(user.id, { avatar: previewUrl });
        success(`Foto de ${user.name} atualizada com sucesso!`);
      }

      if (onAvatarUpdated) {
        onAvatarUpdated(previewUrl);
      }

      await refreshUser();
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar a foto de perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Foto de Perfil do Sócio"
      subtitle={`Altere a foto oficial de exibição de ${user?.name || 'Sócio'}`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
        {/* Top: Current & Live Preview Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={previewUrl || user?.avatar || '/src/assets/images/avatar_ruan_1791062648918.jpg'}
              alt={user?.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-sky-500/40 shadow-lg bg-slate-200 dark:bg-slate-900"
              referrerPolicy="no-referrer"
            />
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
              title="Online"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {user?.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                Sócio Oficial
              </span>
            </div>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">{user?.position}</p>
            <p className="text-[11px] text-slate-400">
              Esta foto aparecerá no menu superior, cabeçalho, registros de atividades e relatórios.
            </p>
          </div>
        </div>

        {/* Tab navigation for photo source */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Computador / Celular</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Tirar Foto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('presets');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'presets'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fotos Oficiais</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('url');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'url'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link / URL</span>
          </button>
        </div>

        {/* Tab 1: Upload from computer / phone */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-sky-400/60 hover:border-sky-500 bg-sky-50/30 dark:bg-sky-950/20 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-md text-sky-500 mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Clique aqui para escolher uma foto
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Ou arraste e solte o arquivo de imagem aqui (JPG, PNG, WebP)
              </p>
              <span className="mt-3 px-3 py-1 bg-sky-500 text-white rounded-lg text-[10px] font-bold shadow-xs">
                Selecionar do Computador ou Celular
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Tab 2: Camera Capture */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Permissão de câmera necessária</p>
                  <p className="text-[11px]">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-72 h-72 rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-sky-400/50 rounded-full m-4" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!isCameraActive}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Foto Agora</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Desligar câmera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Official Preset Portraits */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Escolha uma foto oficial de estúdio da NEXORA GROUP para aplicar instantaneamente:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {executivePresets.map((preset) => {
                const isSelected = previewUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(preset.url);
                      success(`Foto selecionada: ${preset.name}`);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center ring-2 ring-white">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{preset.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Image URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block font-semibold mb-1">Link direto da imagem (URL)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
                >
                  Carregar
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Você pode colar o link da sua foto do LinkedIn, Gravatar ou qualquer servidor de imagens.
            </p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(user?.avatar || '');
              info('Alterações revertidas');
            }}
            disabled={previewUrl === user?.avatar}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Original</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Nova Foto de Perfil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
