
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