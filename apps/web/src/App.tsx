import {
  Button,
  Column,
  Container,
  Heading,
  Row,
  Text,
} from "@umami/react-zen";

function App() {
  return (
    <Container maxWidth="lg" padding="6">
      <Column gap="8">
        <Row
          justifyContent="space-between"
          alignItems="center"
          gap="4"
        >
          <Column gap="1">
            <Text color="muted">SyncLearn</Text>
            <Heading size="3xl">Apprendre, progresser, simplement.</Heading>
          </Column>

          <Button variant="primary">
            Explorer les cours
          </Button>
        </Row>

        <Column gap="2">
          <Heading size="lg">Bienvenue sur SyncLearn</Heading>
          <Text color="muted">
            Une plateforme e-learning pensée pour des apprenants
            francophones et anglophones.
          </Text>
        </Column>
      </Column>
    </Container>
  );
}

export default App;