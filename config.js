
import * as dotenv from 'dotenv';
import { getArgs } from './helpers.js';

dotenv.config();

export const args = getArgs();

/**
 * possible values: 'openai' or 'ollama'
 */
export const AI_PROVIDER = args.PROVIDER || process.env.PROVIDER || 'openai'


/** 
 * name of the model to use.
 * can use this to switch between different local models.
 */
export const MODEL = args.MODEL || process.env.MODEL;