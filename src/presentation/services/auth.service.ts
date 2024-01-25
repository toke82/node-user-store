import { JwtAdapter, bcryptAdapter } from "../../config";
import { UserModel } from "../../data";
import { CustomError, RegisterUserDto, LoginUserDto } from "../../domain";
import { UserEntity } from '../../domain/entities/user.entity';





export class AuthService {

    // DI
    constructor() {}

    public async registerUser( registerUserDto: RegisterUserDto) {

        const existUser = await UserModel.findOne({ email: registerUserDto.email });
        if ( existUser ) throw CustomError.badRequest('Email already exist');

        try {
            const user = new UserModel(registerUserDto);            

            // Encriptar la contraseña
            user.password = bcryptAdapter.hash( registerUserDto.password );

            await user.save();

            // JWT <---- para mantener la autenticación del usuario

            // Email de confirmacion
            
            const { password, ...userEntity} = UserEntity.fromObject(user); 

            return { 
                user: userEntity, 
                token: 'ABC' 
            };

        } catch (error) {
            throw CustomError.internalServer(`${ error }`);
        }
 
    }

    public async loginUser( loginUserDto: LoginUserDto) {

        const user = await UserModel.findOne({ email: loginUserDto.email });
        if (!user) throw CustomError.badRequest('Email and password not valid');
        
        const isMatching = bcryptAdapter.compare( loginUserDto.password, user.password );
        if ( !isMatching ) throw CustomError.badRequest('Email and password not valid');

        const { password, ...userEntity } = UserEntity.fromObject( user );

        const token = await JwtAdapter.generateToken({ id: user.id, email: user.email });
        if ( !token ) throw CustomError.internalServer('Error while creatting JWT');

        return {
            user: userEntity,
            token: token,
        }
    }
}