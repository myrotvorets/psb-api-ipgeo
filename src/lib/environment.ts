import { cleanEnv, port, str } from 'envalid';

export interface Environment {
    NODE_ENV: string;
    PORT: number;
    GEOIP_CITY_FILE: string;
    GEOIP_ISP_FILE: string;
}

let environ: Environment | null = null;

export function environment(reset = false): Environment {
    if (!environ || reset) {
        environ = cleanEnv(process.env, {
            NODE_ENV: str({ default: 'development' }),
            PORT: port({ default: 3000 }),
            GEOIP_CITY_FILE: str({ default: '' }),
            GEOIP_ISP_FILE: str({ default: '' }),
        });
    }

    return environ;
}
