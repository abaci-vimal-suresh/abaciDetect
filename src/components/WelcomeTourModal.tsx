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
        <>
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                @keyframes checkPop {
                    0% {
                        opacity: 0;
                        transform: scale(0.5) rotate(-45deg);
                    }
                    70% {
                        transform: scale(1.1) rotate(5deg);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) rotate(0deg);
                    }
                }

                .tour-welcome-content {
                    padding: 0;
                }

                .tour-hero {
                    background: #7a3a6f;
                    padding: 1rem 2rem 1rem;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    margin: -1.5rem -1.5rem 0 -1.5rem;
                    border-radius: 1.5rem 1.5rem 0 0;
                }

                .tour-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 2rem;
                    pointer-events: none;
                }

                .tour-icon-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 80px;
                    height: 80px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 20px;
                    margin-bottom: 1rem;
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }

                .tour-icon-badge .icon {
                    font-size: 3rem;
                    color: #ffffff;
                }

                .animate-in .tour-icon-badge {
                    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .animate-in .tour-icon-badge .icon {
                    animation: pulse 2s ease-in-out infinite 0.5s;
                }

                .tour-hero-title {
                    color: #ffffff;
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.01em;
                }

                .animate-in .tour-hero-title {
                    animation: slideUp 0.5s ease-out 0.1s both;
                }

                .tour-hero-subtitle {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.95rem;
                    font-weight: 400;
                    margin-bottom: 0;
                }

                .animate-in .tour-hero-subtitle {
                    animation: slideUp 0.5s ease-out 0.2s both;
                }

                .tour-content {
                    padding: 2rem 2rem 1.5rem;
                }

                .tour-intro {
                    text-align: center;
                    color: #495057;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }

                .animate-in .tour-intro {
                    animation: slideUp 0.5s ease-out 0.3s both;
                }

                .tour-checklist {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.75rem;
                }

                .tour-check-item {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                    padding: 0.875rem 1rem;
                    background: #EEF2F5;
                    border-radius: 0.75rem;
                    box-shadow: 3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .tour-check-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 0;
                    background: #46bcaa;
                    border-radius: 0 2px 2px 0;
                    transition: height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .tour-check-item:hover {
                    transform: translateX(4px);
                }

                .tour-check-item:hover::before {
                    height: 70%;
                }

                .animate-in .tour-check-item:nth-child(1) {
                    animation: slideUp 0.4s ease-out 0.4s both;
                }

                .animate-in .tour-check-item:nth-child(2) {
                    animation: slideUp 0.4s ease-out 0.5s both;
                }

                .animate-in .tour-check-item:nth-child(3) {
                    animation: slideUp 0.4s ease-out 0.6s both;
                }

                .tour-check-icon {
                    flex-shrink: 0;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #46bcaa;
                    border-radius: 10px;
                    color: #ffffff;
                    font-size: 1.25rem;
                    box-shadow: 0 2px 8px rgba(70, 188, 170, 0.25);
                }

                .animate-in .tour-check-icon {
                    animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .tour-check-text {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #343a40;
                    flex: 1;
                }

                .tour-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 0.875rem;
                }

                .animate-in .tour-buttons {
                    animation: slideUp 0.5s ease-out 0.7s both;
                }

                .tour-button {
                    padding: 0.75rem 1.25rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    font-size: 0.95rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    position: relative;
                    overflow: hidden;
                }

                .tour-button-skip {
                    background: #EEF2F5;
                    color: #6c757d;
                    box-shadow: 3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff;
                }

                .tour-button-skip:hover {
                    box-shadow: inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff;
                    color: #495057;
                }

                .tour-button-primary {
                    background: #7a3a6f;
                    color: #ffffff;
                    box-shadow: 4px 4px 10px #d1d9e6, -4px -4px 10px #ffffff;
                }

                .tour-button-primary::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    transform: translate(-50%, -50%);
                    transition: width 0.5s ease, height 0.5s ease;
                }

                .tour-button-primary:hover::before {
                    width: 300px;
                    height: 300px;
                }

                .tour-button-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff;
                }

                .tour-button-primary:active {
                    transform: translateY(0);
                }

                .tour-button-icon {
                    transition: transform 0.3s ease;
                    font-size: 1.1rem;
                }

                .tour-button-primary:hover .tour-button-icon {
                    transform: translateX(4px);
                }

                @media (max-width: 768px) {
                    .tour-hero {
                        padding: 1.75rem 1.5rem 1.25rem;
                    }

                    .tour-icon-badge {
                        width: 70px;
                        height: 70px;
                    }

                    .tour-icon-badge .icon {
                        font-size: 2.5rem;
                    }

                    .tour-hero-title {
                        font-size: 1.75rem;
                    }

                    .tour-content {
                        padding: 1.75rem 1.5rem 1.25rem;
                    }

                    .tour-buttons {
                        grid-template-columns: 1fr;
                    }
                }

                /* Dark mode */
                [data-bs-theme="dark"] .tour-hero::after {
                    background: linear-gradient(to bottom, transparent, #1f2128);
                }

                [data-bs-theme="dark"] .tour-intro {
                    color: #adb5bd;
                }

                [data-bs-theme="dark"] .tour-check-item {
                    background: #1f2128;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 6px 6px 12px rgba(0, 0, 0, 0.35);
                }

                [data-bs-theme="dark"] .tour-check-text {
                    color: #e9ecef;
                }

                [data-bs-theme="dark"] .tour-button-skip {
                    background: #1f2128;
                    color: #adb5bd;
                    box-shadow: inset 3px 3px 6px rgba(0, 0, 0, 0.35);
                }

                [data-bs-theme="dark"] .tour-button-skip:hover {
                    color: #e9ecef;
                }

                [data-bs-theme="dark"] .tour-button-primary {
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 6px 6px 12px rgba(0, 0, 0, 0.35);
                }

                [data-bs-theme="dark"] .tour-button-primary:hover {
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 8px 8px 16px rgba(0, 0, 0, 0.4);
                }
            `}</style>

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
        </>
    );
};

export default WelcomeTourModal;