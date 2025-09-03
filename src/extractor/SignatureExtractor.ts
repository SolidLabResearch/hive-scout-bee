import {Quad} from "n3";
import { StreamSignature } from "../Types";
/**
 * It extracts the statistical features from a stream of RDF quads.
 * The class provides methods to compute various statistics such as
 * variance, skewness, and entropy based on the RDF data.
 * The RDF data is expected to be for each window chunk of the stream.
 * @export
 * @class SignatureExtractor
 */
export class SignatureExtractor {

    /**
     * Creates an instance of SignatureExtractor.
     * @memberof SignatureExtractor
     */
    constructor(){

    }

    /**
     * Extracts statistical features from a window of RDF quads.
     * @param {Set<Quad>} windowData - The set of RDF quads representing the window data.
     * @return {StreamSignature} - The extracted stream signature.
     * @memberof SignatureExtractor
     */
    extractSignature(windowData: Set<Quad>): StreamSignature {
        const tripleCount = windowData.size;
        const numericValues: number[] = [];

        // Collect the numeric values from the quads
        for (const quad of windowData) {
            const objectValue = quad.object.value;
            
            // Try to parse numeric values from the object
            if (quad.object.termType === 'Literal') {
                // Handle different numeric datatypes
                if (quad.object.datatype) {
                    const datatypeValue = quad.object.datatype.value;
                    if (datatypeValue.includes('integer') || 
                        datatypeValue.includes('decimal') || 
                        datatypeValue.includes('double') || 
                        datatypeValue.includes('float')) {
                        const numValue = parseFloat(objectValue);
                        if (!isNaN(numValue)) {
                            numericValues.push(numValue);
                        }
                    } else if (datatypeValue.includes('string')) {
                        // Try to parse string literals that might contain numbers
                        const numValue = parseFloat(objectValue);
                        if (!isNaN(numValue)) {
                            numericValues.push(numValue);
                        }
                    }
                } else {
                    // Try to parse as number even without explicit datatype
                    const numValue = parseFloat(objectValue);
                    if (!isNaN(numValue)) {
                        numericValues.push(numValue);
                    }
                }
            }
        }

        // Calculate statistical measures
        const variance = this.calculateVariance(numericValues);
        const skewness = this.calculateSkewness(numericValues);
        const entropy = this.calculateEntropy(windowData);

        return {
            tripleCount,
            variance,
            skewness,
            entropy
        };
    }

    /**
     * Calculates the mean of an array of numbers.
     * @private
     * @param {number[]} values - The array of numbers to calculate the mean for.
     * @return {number} - The calculated mean.
     * @memberof SignatureExtractor
     */
    private calculateMean(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Calculates the variance of an array of numbers.
     * @private
     * @param {number[]} values - The array of numbers to calculate the variance for.
     * @return {number} - The calculated variance.
     * @memberof SignatureExtractor
     */
    private calculateVariance(values: number[]): number {
        if (values.length <= 1) return 0;
        
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
    }

    /**
     * Calculates the skewness of an array of numbers.
     * @private
     * @param {number[]} values - The array of numbers to calculate the skewness for.
     * @return {number} - The calculated skewness.
     * @memberof SignatureExtractor
     */
    private calculateSkewness(values: number[]): number {
        if (values.length <= 2) return 0;
        
        const mean = this.calculateMean(values);
        const variance = this.calculateVariance(values);
        const stdDev = Math.sqrt(variance);
        
        if (stdDev === 0) return 0;
        
        const cubedDiffs = values.map(val => Math.pow((val - mean) / stdDev, 3));
        const n = values.length;
        return (n / ((n - 1) * (n - 2))) * cubedDiffs.reduce((sum, val) => sum + val, 0);
    }

    /**
     * Calculates the entropy of a set of quads. 
     * @private
     * @param {Set<Quad>} quads
     * @return {*}  {number}
     * @memberof SignatureExtractor
     */
    private calculateEntropy(quads: Set<Quad>): number {
        // Calculate entropy based on the distribution of predicates
        const predicateCount = new Map<string, number>();
        
        for (const quad of quads) {
            const predicate = quad.predicate.value;
            predicateCount.set(predicate, (predicateCount.get(predicate) || 0) + 1);
        }
        
        const total = quads.size;
        let entropy = 0;
        
        for (const count of predicateCount.values()) {
            const probability = count / total;
            if (probability > 0) {
                entropy -= probability * Math.log2(probability);
            }
        }
        
        return entropy;
    }
}