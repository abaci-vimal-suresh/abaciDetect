import React from 'react'
import Card, { CardBody, CardHeader } from '../../bootstrap/Card'
import { Col, Row } from 'reactstrap'

function TaxSettings() {
  return (
    <Card className="p-2">
      <CardHeader className="h4 fw-bold">
        Tax Details
      </CardHeader>
      <CardBody>
        {/* Tax Information */}
        <Row className="mb-4">
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax Code</p>
            <h5 className="fw-bold">VAT05</h5>
          </Col>
          
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax Name</p>
            <h5 className="fw-bold">VAT @5%</h5>
          </Col>
          
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax Rate</p>
            <h5 className="fw-bold">5%</h5>
          </Col>
          
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax Application</p>
            <h5 className="fw-bold">Base Value</h5>
          </Col>
          
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax Method</p>
            <h5 className="fw-bold">Inclusive</h5>
          </Col>
          
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax ID No.</p>
            <h5 className="fw-bold">AE-VAT-345</h5>
          </Col>
          
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax Reg No.</p>
            <h5 className="fw-bold">REG-VAT-II2</h5>
          </Col>
          
          <Col md={4} className="mb-3">
            <p className="text-muted mb-1">Tax Authority</p>
            <h5 className="fw-bold">UAE Tax Authority</h5>
          </Col>
        </Row>

        {/* Divider */}
        <hr className="my-4" />

        {/* Tax Description */}
        <div>
          <h5 className="fw-bold mb-3">Tax Description</h5>
          <p className="text-muted">
            Lorem ipsum dolor sit amet. Sed possimus cupiditate non nihil tempore aut temporibus voluptatem. 
            Et excepturi consequatur qui corporis distinctio quo explicabo quam et vitae consequatur non 
            scepe accusamus eos sunt porro sed mollitia sapiente.
          </p>
        </div>
      </CardBody>
    </Card>
  )
}

export default TaxSettings