import React from 'react'
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card'
import { Col, Row } from 'reactstrap'
import Button from '../../bootstrap/Button'

function SubscriptionSettings() {
  return (
    <Card className="">
      <CardHeader borderSize={1}>
      <CardLabel icon='CalendarToday' iconColor='primary'>
      <CardTitle tag='div' className='h4' color='primary'>Plan A1</CardTitle>
      </CardLabel>
      </CardHeader>
      <CardBody>

        {/* Plan Details - Horizontal Layout */}
        <div className='d-flex justify-content-between'>
        <Row className="" style={{width: '70%'}}>
          <Col md={3} className="mb-3 px-2">
            <div className="text-center">
              <p className="text-muted mb-1 small">Validity</p>
              <p className="fw-bold mb-0">11.05.25 - 11.05.26</p>
            </div>
          </Col>
          <Col md={3} className="mb-3 px-2">
            <div className="text-center">
              <p className="text-muted mb-1 small">Charge to</p>
              <p className="fw-bold mb-0">GTCC</p>
            </div>
          </Col>
          <Col md={3} className="mb-3 px-2">
            <div className="text-center">
              <p className="text-muted mb-1 small">Monthly Payment</p>
              <p className="fw-bold mb-0">1000 AED</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="text-center">
              <p className="text-muted mb-1 small">Yearly Payment</p>
              <p className="fw-bold mb-0">10000 AED</p>
            </div>
          </Col>
          {/* <Col md={2} className="" style={{}}>
          
          </Col> */}
        </Row>
        <div>
        <Button 
            color="danger" 
            className="px-3 py-2"
            icon=''

            // style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}
          >
           Deactivate
          </Button>
        </div>
        </div>
      

        {/* Deactivate Button */}
        {/* <div className="text-end">
         
        </div> */}
      </CardBody>
    </Card>
  )
}

export default SubscriptionSettings