import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Fisheye, CameraControls, PerspectiveCamera, Environment, Html, Loader } from '@react-three/drei';
import { Level, Sudo, Camera, Cactus, Box } from './Scene';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import './ThreeDPage.scss';

const ThreeDPage = () => {
    return (
        <PageWrapper title='ThreeJS Adventure'>
            <Page container='fluid' className='threed-page-container p-0 overflow-hidden'>
                <div className='w-100 h-100 position-relative'>
                    <Canvas flat className='threed-canvas'>
                        <Suspense fallback={<Html center>Loading 3D Scene...</Html>}>
                            <Fisheye zoom={0}>
                                <CameraControls minPolarAngle={0} maxPolarAngle={Math.PI / 1.6} />
                                <ambientLight intensity={Math.PI / 2} />
                                <group scale={20} position={[5, -11, -5]}>
                                    <Level />
                                    <Sudo />
                                    <Camera />
                                    <Cactus />
                                    <Box position={[-0.8, 1.4, 0.4]} scale={0.15} />
                                </group>
                                <Environment preset="city" background blur={1} />
                                <PerspectiveCamera makeDefault position={[0, 0, 18.5]} />
                            </Fisheye>
                        </Suspense>
                    </Canvas>
                    <Loader />

                    <div className='threed-overlay shadow-sm border border-light border-opacity-10 p-4 rounded-3'>
                        <h2 className='mb-2 text-white fw-bold'>Interactive 3D Perspective</h2>
                        <p className='text-white-50 mb-0'>
                            Use your mouse to rotate, zoom, and interact with the elements.
                        </p>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default ThreeDPage;
