export interface VeltItem {
    material?: string;
    item?: string;
    count?: string;
    name?: string;
    lore?: string[] | string;
    durability?: number;
    unbreakable?: boolean;
    customModelData?: number;
    enchantments?: {
        type: string;
        level: number;
    }[];
    itemFlags?: string[];
}

export type Item = VeltItem | string | object;
