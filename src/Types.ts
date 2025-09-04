
/**
 * Interface representing the signature of a stream.
 * @export
 * @interface StreamSignature
 */
export interface StreamSignature {
    tripleCount : number;
    variance : number; 
    skewness : number;
    entropy : number;
    fftEntropy : number;
}

/**
 * Interface representing thresholds for approach selection.
 * @export
 * @interface ApproachThresholds
 */
export interface ApproachThresholds {
    variance?: number;
    skewness?: number;
    entropy?: number;
    fftEntropy?: number;
    tripleCount?: number;
}

/**
 * Interface representing an approach configuration.
 * @export
 * @interface ApproachConfig
 */
export interface ApproachConfig {
    name: string;
    description?: string;
    minThresholds?: ApproachThresholds;
    maxThresholds?: ApproachThresholds;
    priority?: number; // Higher number = higher priority when multiple approaches match
}

/**
 * Interface representing the result of approach selection.
 * @export
 * @interface ApproachRecommendation
 */
export interface ApproachRecommendation {
    recommendedApproach: string;
    matchingApproaches: string[];
    signature: StreamSignature;
    confidence: number; // 0-1 scale
}