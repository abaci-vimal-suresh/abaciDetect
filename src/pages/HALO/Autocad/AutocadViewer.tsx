import React, { useRef } from 'react';
import { useSvgDrawing } from 'react-hooks-svgdrawing';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, { SubHeaderLeft } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import { getSvgPathCode, drawSetOfPath, rotateDrawingAutocad } from './autocadUtils';

const AutocadViewer = () => {
    const [renderRef, action] = useSvgDrawing({
        penWidth: 3,
        penColor: '#3B82F6',
    });

    const drawInAutocad = () => {
        if (!window.Acad || !window.Acad.Editor) {
            alert('AutoCAD API not found. Please ensure you are running this in an AutoCAD environment.');
            return;
        }

        // Obtener código svg | Get svg code
        const code = getSvgPathCode(renderRef as React.RefObject<HTMLDivElement>);

        // Dibujar código | Draw code
        code.forEach(path => drawSetOfPath(path));

        // Rotar dibujo
        rotateDrawingAutocad(code);
    };

    const clearDraw = () => {
        // Clear div
        action.clear();

        if (window.Acad && window.Acad.Editor) {
            // Clear Autocad
            window.Acad.Editor.executeCommand(`SELECT ALL `);
            window.Acad.Editor.executeCommand(`ERASE `, '');
        }
    };

    return (
        <PageWrapper title='AutoCAD Viewer'>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: 'HALO', to: '/halo/dashboard' },
                            { title: 'AutoCAD Viewer', to: '/halo/autocad' },
                        ]}
                    />
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row h-100'>
                    <div className='col-12'>
                        <Card stretch>
                            <CardHeader>
                                <CardTitle>
                                    <Icon icon='Drawing' className='me-2' />
                                    SVG to AutoCAD Canvas
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <div className='alert alert-info d-flex align-items-center' role='alert'>
                                    <Icon icon='Info' size='lg' className='me-2' />
                                    <div>
                                        Draw on the canvas below and click <strong>"Draw in AutoCAD"</strong> to send the drawing commands to the active AutoCAD session.
                                    </div>
                                </div>

                                <div className='d-flex flex-column align-items-center justify-content-center mt-4'>
                                    <div
                                        ref={renderRef as any}
                                        style={{
                                            border: '2px dashed #CBD5E1',
                                            borderRadius: '8px',
                                            backgroundColor: '#F8FAFC',
                                            width: '100%',
                                            maxWidth: '800px',
                                            height: '500px',
                                            cursor: 'crosshair',
                                            touchAction: 'none'
                                        }}
                                    />

                                    <div className='d-flex gap-3 mt-4'>
                                        <Button
                                            color='primary'
                                            icon='Send'
                                            size='lg'
                                            onClick={drawInAutocad}
                                            className='px-4'
                                        >
                                            Draw in AutoCAD
                                        </Button>
                                        <Button
                                            color='danger'
                                            isLight
                                            icon='Delete'
                                            size='lg'
                                            onClick={clearDraw}
                                            className='px-4'
                                        >
                                            Clear Canvas
                                        </Button>
                                    </div>
                                </div>

                                <div className='mt-5'>
                                    <h5 className='mb-3'>Shape Shortcuts</h5>
                                    <div className='d-flex gap-2 flex-wrap'>
                                        <Button
                                            color='info'
                                            isLight
                                            onClick={() => window.Acad?.Editor?.executeCommand('RECTANG 0,0,0 10,10,0')}
                                        >
                                            Square
                                        </Button>
                                        <Button
                                            color='info'
                                            isLight
                                            onClick={() => window.Acad?.Editor?.executeCommand('CIRCLE 17.5,5,0 5')}
                                        >
                                            Circle
                                        </Button>
                                        <Button
                                            color='info'
                                            isLight
                                            onClick={() => window.Acad?.Editor?.executeCommand('PLINE 25,0 30,10 35,0 25,0 c')}
                                        >
                                            Triangle
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default AutocadViewer;
