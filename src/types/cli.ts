export interface Config {
    groups: ApiGroup[]
}

export interface ApiGroup {
    name: string;
    comment: string;
    apiPrefix: RegExp
}