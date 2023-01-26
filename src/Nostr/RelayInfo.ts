export interface RelayInfo {
    name?: string,
    description?: string,
    pubkey?: string,
    contact?: string,
    supported_nips?: number[],
    software?: string,
    version?: string,
    payment?: {
        lnurlp?: string,
        description?: string
    }
}