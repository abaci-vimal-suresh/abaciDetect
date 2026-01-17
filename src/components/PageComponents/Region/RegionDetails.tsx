import React, { useState } from 'react';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import { Col, Row } from 'reactstrap';
// import Avatar from '../../components/Avatar';
// import Button from '../../components/bootstrap/Button';
import no_logo from '../../../assets/img/dummy_organization.png';
import Avatar from '../../Avatar';
import Button from '../../bootstrap/Button';
import Checks from '../../bootstrap/forms/Checks';

function RegionDetails() {
  const [regionLogo, setRegionLogo] = useState(no_logo);
  const [municipalityLogo, setMunicipalityLogo] = useState(no_logo);
  const [enableSubscription, setEnableSubscription] = useState(false);
  const [selfRegisterGTCC, setSelfRegisterGTCC] = useState(false);
  const [selfRegisterEstablishment, setSelfRegisterEstablishment] = useState(false);

  const handleLogoUpload = (setLogo) => {
    // In a real implementation, this would open a file dialog and process the image
    const fakeUpload = URL.createObjectURL(new Blob());
    setLogo(fakeUpload);
  };

  return (
    <Card className="">
        
      <CardHeader className="h4 fw-bold">
          <CardLabel icon='MyLocation' iconColor='primary'>
        <CardTitle tag='div' className='h4'>Region Details</CardTitle>
        </CardLabel>
      </CardHeader>
      <CardBody>
        {/* Logo Section */}
        <Row className="mb-4">
          <Col md={6} className="mb-3">
            <div className="d-flex flex-column align-items-center">
              <Avatar 
                size={120} 
                src={regionLogo} 
                shadow="default" 
                style={{objectFit:'cover', marginBottom: '10px'}}
              />
              <p className="text-muted mb-2">Region Logo</p>
              <Button 
                color="primary" 
                isLight 
                icon="CloudUpload"
                onClick={() => handleLogoUpload(setRegionLogo)}
              >
                Upload
              </Button>
            </div>
          </Col>
          <Col md={6} className="mb-3">
            <div className="d-flex flex-column align-items-center">
              <Avatar 
                size={120} 
                src={municipalityLogo} 
                shadow="default" 
                style={{objectFit:'cover', marginBottom: '10px'}}
              />
              <p className="text-muted mb-2">Municipality Logo</p>
              <Button 
                color="primary" 
                isLight 
                icon="CloudUpload"
                onClick={() => handleLogoUpload(setMunicipalityLogo)}
              >
                Upload
              </Button>
            </div>
          </Col>
        </Row>

        {/* Region Information */}
        <Row className="mb-4">
          <Col md={12} className="mb-3">
            <p className="text-muted mb-1">Region Name</p>
            <h5 className="fw-bold">Abu Dhabi Region</h5>
          </Col>
          
          <Col md={6} className="mb-3">
            <p className="text-muted mb-1">City</p>
            <h5 className="fw-bold">Abu Dhabi</h5>
          </Col>
          
          <Col md={6} className="mb-3">
            <p className="text-muted mb-1">Country</p>
            <h5 className="fw-bold">United Arab Emirates</h5>
          </Col>
          
          <Col md={6} className="mb-3">
            <p className="text-muted mb-1">Region Admin</p>
            <h5 className="fw-bold">John Doe</h5>
          </Col>
          
          <Col md={12} className="mb-3">
            <p className="text-muted mb-1">Address</p>
            <h5 className="fw-bold">
              Al Nahda 1, Al Ittihad Road, Flat 302, <br />
              Burj Al Noor Building, Dubai, UAE
            </h5>
          </Col>
          
          <Col md={6} className="mb-3">
            <p className="text-muted mb-1">Timezone</p>
            <h5 className="fw-bold">Gulf Standard Time</h5>
          </Col>
          
          <Col md={6} className="mb-3">
            <p className="text-muted mb-1">Currency</p>
            <h5 className="fw-bold">AED</h5>
          </Col>
        </Row>

        <hr />

        {/* Toggle Options */}
        <Row>
          <Col md={12} className="mb-3">

          <Checks
            id='enableSubscription'
            label='Enable Subscription'
            name='Enable Subscription'
            // value={enableSubscription}
            onChange={() => setEnableSubscription(!enableSubscription)}
            checked={enableSubscription}
        />
        
          </Col>
          
          <Col md={12} className="mb-3">
            <Checks
            id='selfRegisterGTCC'
            label='Self Register New GTCC'
            name='Self Register New GTCC'
            // value={enableSubscription}
            onChange={() => setSelfRegisterGTCC(!selfRegisterGTCC)}
            checked={selfRegisterGTCC}
        />
          </Col>
          
          <Col md={12} className="mb-3">
           <Checks
            id='selfRegisterEstablishment'
            label='Self Register New Establishment'
            name='Self Register New Establishment'
            // value={enableSubscription}
            onChange={() => setSelfRegisterEstablishment(!selfRegisterEstablishment)}
            checked={selfRegisterEstablishment}
        />
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
}

export default RegionDetails;