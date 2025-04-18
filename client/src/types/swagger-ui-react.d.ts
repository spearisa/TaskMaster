declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';

  export interface SwaggerUIProps {
    spec: any;
    url?: string;
    layout?: string;
    docExpansion?: 'list' | 'full' | 'none';
    deepLinking?: boolean;
    defaultModelsExpandDepth?: number;
    displayOperationId?: boolean;
    filter?: boolean | string;
    maxDisplayedTags?: number;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    onComplete?: () => void;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}