const { SignatureExtractor } = require('./dist/extractor/SignatureExtractor.js');
const { DataFactory } = require('n3');

const { namedNode, literal, quad } = DataFactory;
const extractor = new SignatureExtractor();

console.log('🎵 FFT Entropy Demo\n');

// Test 1: Constant values (should have low FFT entropy)
console.log('1. Constant values [5, 5, 5, 5]:');
const constantData = new Set([
    quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('5')),
    quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('5')),
    quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'), literal('5')),
    quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p1'), literal('5'))
]);
const constantResult = extractor.extractSignature(constantData);
console.log(`   Predicate Entropy: ${constantResult.entropy.toFixed(3)}`);
console.log(`   FFT Entropy: ${constantResult.fftEntropy.toFixed(3)}\n`);

// Test 2: Linear sequence (should have moderate FFT entropy)
console.log('2. Linear sequence [1, 2, 3, 4]:');
const linearData = new Set([
    quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('1')),
    quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('2')),
    quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'), literal('3')),
    quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p1'), literal('4'))
]);
const linearResult = extractor.extractSignature(linearData);
console.log(`   Predicate Entropy: ${linearResult.entropy.toFixed(3)}`);
console.log(`   FFT Entropy: ${linearResult.fftEntropy.toFixed(3)}\n`);

// Test 3: Periodic pattern (should have specific FFT characteristics)
console.log('3. Periodic pattern [1, 0, 1, 0]:');
const periodicData = new Set([
    quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('1')),
    quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('0')),
    quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'), literal('1')),
    quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p1'), literal('0'))
]);
const periodicResult = extractor.extractSignature(periodicData);
console.log(`   Predicate Entropy: ${periodicResult.entropy.toFixed(3)}`);
console.log(`   FFT Entropy: ${periodicResult.fftEntropy.toFixed(3)}\n`);

// Test 4: Random-like values (should have high FFT entropy)
console.log('4. Random-like values [1, 7, 3, 9]:');
const randomData = new Set([
    quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('1')),
    quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('7')),
    quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'), literal('3')),
    quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p1'), literal('9'))
]);
const randomResult = extractor.extractSignature(randomData);
console.log(`   Predicate Entropy: ${randomResult.entropy.toFixed(3)}`);
console.log(`   FFT Entropy: ${randomResult.fftEntropy.toFixed(3)}\n`);

console.log('📊 Summary:');
console.log('- FFT Entropy captures frequency domain patterns in numeric data');
console.log('- Predicate Entropy measures distribution of RDF predicates');
console.log('- Both provide complementary insights into stream characteristics');
