import React, { useState, useEffect } from 'react';
import { useTour } from '@reactour/tour';
import { useNavigate } from 'react-router-dom';
import Modal, { ModalBody, ModalHeader, ModalTitle } from './bootstrap/Modal';
import Button from './bootstrap/Button';
import Icon from '../components/icon/Icon';

const WelcomeTourModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [animate, setAnimate] = useState(false);
    const { setIsOpen: setTourOpen, setCurrentStep } = useTour();
    const navigate = useNavigate();

    useEffect(() => {
        const shouldShow = localStorage.getItem('showGuidedTour');
        if (shouldShow === 'true') {
            setIsOpen(true);
            setTimeout(() => setAnimate(true), 100);
        }
    }, []);

    const handleStartTour = () => {
        setIsOpen(false);
        localStorage.setItem('showGuidedTour', 'active');
        setCurrentStep(0);
        setTourOpen(true);
        navigate('/users?startTour=true');
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
                <div className={`tour-welcome-content ${animate ? 'animate-in' : ''}`}>
                    <div className='tour-hero'>
                        <div className='tour-icon-badge'>
                            <Icon icon='AutoAwesome' className='icon' />
                        </div>
                        <h2 className='tour-hero-title'>Welcome to HALO!</h2>
                        <p className='tour-hero-subtitle'>
                            Your administrator account is ready
                        </p>
                    </div>

                    <div className='tour-content'>
                        <p className='tour-intro'>
                            Let's quickly set up your sensor monitoring system in three simple steps
                        </p>

                        <div className='tour-checklist'>
                            <div className='tour-check-item'>
                                <div className='tour-check-icon'>
                                    <Icon icon='CheckCircle' />
                                </div>
                                <span className='tour-check-text'>Create your first user</span>
                            </div>
                            <div className='tour-check-item'>
                                <div className='tour-check-icon'>
                                    <Icon icon='CheckCircle' />
                                </div>
                                <span className='tour-check-text'>Create your first coverage area</span>
                            </div>
                            <div className='tour-check-item'>
                                <div className='tour-check-icon'>
                                    <Icon icon='CheckCircle' />
                                </div>
                                <span className='tour-check-text'>Register and deploy your sensors</span>
                            </div>
                        </div>

                        <div className='tour-buttons'>
                            <button className='tour-button tour-button-skip' onClick={handleSkip}>
                                Skip
                            </button>
                            <button className='tour-button tour-button-primary' onClick={handleStartTour}>
                                Start Setup
                                <Icon icon='ArrowForward' className='tour-button-icon' />
                            </button>
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default WelcomeTourModal;