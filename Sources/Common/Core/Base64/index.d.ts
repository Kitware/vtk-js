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
export declare function isValidChar(c: string): boolean;

/**
 * 
 * @param b64Str 
 * @return  
 */
export declare function extractChunks(b64Str: string): IChunk[];

/**
 * 
 * @param b64Str 
 * @param chunk 
 * @param dstOffset 
 * @param uint8 
 * @return  
 */
export declare function writeChunk(b64Str: string, chunk: IChunk, dstOffset: number, uint8: Float32Array): number;

/**
 * 
 * @param b64Str 
 * @return  
 */
export declare function toArrayBuffer(b64Str: string): ArrayBuffer;
