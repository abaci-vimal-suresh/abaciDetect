import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '../../../../../../components/bootstrap/Card';
import FormGroup from '../../../../../../components/bootstrap/forms/FormGroup';
import Input from '../../../../../../components/bootstrap/forms/Input';
import InputGroup, { InputGroupText } from '../../../../../../components/bootstrap/forms/InputGroup';
import Icon from '../../../../../../components/icon/Icon';

interface AuthCardProps {
    username: string;
    password: string;
    showPassword: boolean;
    onUsernameChange: (val: string) => void;
    onPasswordChange: (val: string) => void;
    onTogglePassword: () => void;
}

const AuthCard: React.FC<AuthCardProps> = ({
    username,
    password,
    showPassword,
    onUsernameChange,
    onPasswordChange,
    onTogglePassword,
}) => (
    <Card>
        <CardHeader>
            <CardTitle className='m-0 fs-6 fw-bold'>Authentication</CardTitle>
        </CardHeader>
        <CardBody className='p-3'>
            <div className='row g-3'>
                <div className='col-12'>
                    <FormGroup label='Username'>
                        <Input
                            value={username}
                            onChange={(e: any) => onUsernameChange(e.target.value)}
                            placeholder='Sensor username'
                        />
                    </FormGroup>
                </div>
                <div className='col-12'>
                    <FormGroup label='Password'>
                        <InputGroup>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e: any) => onPasswordChange(e.target.value)}
                                placeholder='Sensor password'
                            />
                            <InputGroupText>
                                <span
                                    style={{ cursor: 'pointer' }}
                                    onClick={onTogglePassword}
                                    title={showPassword ? 'Hide Password' : 'Show Password'}
                                >
                                    <Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} />
                                </span>
                            </InputGroupText>
                        </InputGroup>
                    </FormGroup>
                </div>
            </div>
        </CardBody>
    </Card>
);

export default AuthCard;
