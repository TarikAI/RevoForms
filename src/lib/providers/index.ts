// AI Providers
export {
  type AIProviderConfig,
  type AICapability,
  getAIProviders,
  aiComplete,
  aiVisionAnalyze,
  createZaiProvider,
  createOpenRouterProvider,
  createOpenAIProvider,
  createAnthropicProvider,
} from './ai-provider'

// Image Editing Providers (NanoBanana)
export {
  type ImageEditCapability,
  type ImageEditProviderConfig,
  type ImageEditRequest,
  type ImageEditOperation,
  type ImageEditResult,
  type TextOverlay,
  type InpaintRegion,
  getNanoBananaProvider,
  editImage,
  isImageEditingAvailable,
} from './image-edit-provider'

// Image Generation Providers (Pollinations fallback)
export {
  type ImageGenerationRequest,
  type ImageGenerationResult,
  generateImage,
  generateImageBase64,
  generateFormImage,
  getAvailableProviders,
} from './image-generation-provider'

// PDF Provider
export {
  type PDFFieldInfo,
  type PDFFormStructure,
  type PDFProcessingResult,
  type PDFFillResult,
  PDFProvider,
  getPDFProvider,
} from './pdf-provider'
