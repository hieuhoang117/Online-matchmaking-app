import 'dotenv/config';

const required=(key:string):string=>{
    const value=process.env[key];
    if(!value){
        throw new Error(`Thiếu biến môi trường:${key}`);
    }
    return value;
};

export const env={
    accessSecret:required('JWT_ACCESS_SECRET'),
    accessExpires:process.env.JWT_ACCESS_EXPIRES??'15m',
    refreshDays:Number(process.env.REFRESH_TOKEN_DAYS??30),
}