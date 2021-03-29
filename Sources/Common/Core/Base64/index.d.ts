/**
 * 
 */
interface IChunk {
				
	/**
	 * 
	 */
	start: number;
		
	/**
	 * 
	 */
	count: number;
		
	/**
	 * 
	 */
	end: number;
}

// Base64 analysis

/**
 * 
 * @param c 
 * @return  
 */
export declare function isValidChar(c: any): boolean;

/**
 * 
 * @param b64Str 
 * @return  
 */
export declare function extractChunks(b64Str: any): IChunk[];

/**
 * 
 * @param b64Str 
 * @param chunk 
 * @param dstOffset 
 * @param uint8 
 * @return  
 */
export declare function writeChunk(b64Str: any, chunk: 1, dstOffset: number, uint8: Float32Array): number;

/**
 * 
 * @param b64Str 
 * @return  
 */
export declare function toArrayBuffer(b64Str: any): ArrayBuffer;
