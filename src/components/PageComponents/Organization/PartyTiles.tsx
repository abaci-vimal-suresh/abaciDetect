import React from 'react'
import { Row, Col } from 'reactstrap'
// import Card, { CardBody } from './components/bootstrap/Card'
// import Icon from '../../components/icon/Icon' // adjust if your project has a different Icon component
import Card, { CardBody } from '../../bootstrap/Card'
import Icon from '../../icon/Icon'

const items = [
  { label: 'Organization', icon: 'Apartment', color: 'success' },
  { label: 'Region', icon: 'MyLocation', color: 'info' },
  { label: 'GTCC', icon: 'Shield', color: 'danger' },
  { label: 'Establishment', icon: 'LocationCity', color: 'warning' },
  { label: 'Authorities', icon: 'Group', color: 'brown' },
]

function PartyTiles() {
  return (
    <Row className="" style={{marginTop:'-35px',marginBottom:'-10px'}}>
      {items.map((item, index) => (
        <Col key={index} xl={3} lg={4} md={4} sm={6} xs={12}>
          <Card className="border rounded-1 shadow-sm">
            <CardBody className="d-flex align-items-center gap-2">
                {/* @ts-ignore */}
              <Icon icon={item.icon} size="2x" color={item.color} />
              <span className="fw-medium">{item.label}</span>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default PartyTiles
