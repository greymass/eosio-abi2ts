/** Types for the abi format. */

export type Version = string

export interface Type {
    new_type_name: string
    type: string
}

export interface Struct {
    name: string
    base: string
    fields: Array<{
        name: string
        type: string,
    }>
}

export interface Action {
    name: string
    type: string
    ricardian_contract: string
}

export interface Table {
    name: string
    type: string
    index_type: string
    key_names: string[]
    key_types: string[]
}

export interface RicardianClause {
    id: string
    body: string
}

export interface ErrorMessage {
    error_code: string
    error_msg: string
}

export interface Extension {
    tag: number
    value: string
}

export interface Variant {
    name: string
    types: string[]
}

export interface Declaration {
    version: Version
    types?: Type[]
    structs?: Struct[]
    actions?: Action[]
    tables?: Table[]
    ricardian_clauses?: RicardianClause[]
    error_messages?: ErrorMessage[]
    abi_extensions?: Extension[]
    variants?: Variant[]
}
