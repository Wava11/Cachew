import { NotFound } from "..";

export class ExpiredEntry extends NotFound {
    constructor(public readonly expiredAt: number, key: string) {
        super(key);
    }
}