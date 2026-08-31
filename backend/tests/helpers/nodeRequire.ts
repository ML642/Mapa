import { createRequire } from "module";
import path from "path";

//
const rootRequire = createRequire(path.join(process.cwd(), "package.json"));

export function appRequire<T = any>(id: string): T {
	return rootRequire(id) as T;
}

export function appResolve(id: string): string {
	return rootRequire.resolve(id);
}
