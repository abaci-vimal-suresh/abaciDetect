import React, { useState, useEffect } from 'react';
import { useTour } from '@reactour/tour';
import { useNavigate } from 'react-router-dom';
import Modal, { ModalBody, ModalHeader, ModalTitle } from './bootstrap/Modal';
import Button from './bootstrap/Button';
import Icon from '../components/icon/Icon';

const WelcomeTourModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { setIsOpen: setTourOpen, setCurrentStep } = useTour();
    const navigate = useNavigate();

    useEffect(() => {
        const shouldShow = localStorage.getItem('showGuidedTour');
        if (shouldShow === 'true') {
            setIsOpen(true);
        }
    }, []);

    const handleStartTour = () => {
        setIsOpen(false);
        localStorage.setItem('showGuidedTour', 'active');
        setCurrentStep(0);
        setTourOpen(true);
        navigate('/halo/users?startTour=true');
    };

    const handleSkip = () => {
        setIsOpen(false);
        localStorage.setItem('showGuidedTour', 'false');
        navigate('/halo/dashboard');
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg' isStaticBackdrop>
            <ModalHeader setIsOpen={setIsOpen} className='border-0 pb-0'>
                <ModalTitle id='welcome-tour-title'>&nbsp;</ModalTitle>
            </ModalHeader>
            <ModalBody className='px-5 pb-5 pt-0'>
                <div className='text-center mb-4'>
                    <div className='display-1 text-primary mb-3'>
                        <Icon icon='AutoAwesome' />
                    </div>
                    <h2 className='fw-bold mb-2'>🎉 Welcome to HALO!</h2>
                    <p className='lead text-muted'>
                        Your administrator account has been successfully created.
                    </p>
                </div>

                <hr className='my-4 opacity-10' />

                <div className='mb-4 text-center'>
                    <p className='h5 mb-3'>
                        To get started with sensor monitoring, let's set up your coverage areas and register your first devices.
                    </p>
                    <div className='d-flex flex-column align-items-center gap-2 mt-4'>
                        <div className='d-flex align-items-center gap-2 text-success'>
                            <Icon icon='CheckCircle' />
                            <span>Create your first user</span>
                        </div>
                        <div className='d-flex align-items-center gap-2 text-success'>
                            <Icon icon='CheckCircle' />
                            <span>Create your first coverage area</span>
                        </div>
                        <div className='d-flex align-items-center gap-2 text-success'>
                            <Icon icon='CheckCircle' />
                            <span>Register and deploy your sensors</span>
                        </div>
                    </div>
                </div>

                <div className='row mt-5 g-3'>
                    <div className='col-md-6'>
                        <Button
                            color='light'
                            className='w-100 py-3 rounded-pill'
                            onClick={handleSkip}>
                            Skip for Now
                        </Button>
                    </div>
                    <div className='col-md-6'>
                        <Button
                            color='primary'
                            className='w-100 py-3 rounded-pill shadow-primary'
                            onClick={handleStartTour}>
                            Start Guided Setup <Icon icon='ArrowForward' className='ms-2' />
                        </Button>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default WelcomeTourModal;
