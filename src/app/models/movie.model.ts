
export interface Movie {
    id: number;
    nombre: string;
    imagen: string;
    duracion: number;
    sinopsis: string;
    generos: string[];
    edadMinima: number;
    fechaEstreno?: string | null;
    preventaHabilitada?: boolean;
    precioPreventa?: number;
    destacada?: boolean;
}