interface Object {
    isNil: boolean;
}
declare class Nil<T> {
    isNil: boolean;
    valueOf(): T;
}
declare type Optional<T> = T | Nil<T>;
declare const nil: Nil<any>;
