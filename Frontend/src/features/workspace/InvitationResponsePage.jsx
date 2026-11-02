import { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Check, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

export default function InvitationResponsePage() {
  const { token } = useParams();
  const { refreshWorkspaces } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const respond = async (action) => {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const response = await api.post(`/invitations/${token}/${action}`);
      if (action === "accept") {
        await refreshWorkspaces(response.invitation.workspaceId);
        setResult("Invitation accepted. You are now part of the workspace.");
      } else {
        setResult("Invitation declined.");
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to respond to this invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <VStack align="stretch" maxW="600px" mx="auto" spacing={5}>
      <Box>
        <Text
          color="textMuted"
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.12em"
          textTransform="uppercase"
        >
          Workspace invitation
        </Text>
        <Heading mt={2} fontSize={{ base: "2xl", md: "3xl" }}>
          Join your team
        </Heading>
        <Text mt={2} color="textSecondary">
          Responding requires signing in with the invited, verified email
          address.
        </Text>
      </Box>

      <Card className="p-5 sm:p-6">
        <VStack align="stretch" spacing={4}>
          <Text color="textSecondary" fontSize="sm">
            Accepting adds your account to the workspace with the role assigned
            by the inviter. This link is valid for seven days and can only be
            used by the invited email address.
          </Text>
          {error && (
            <Alert status="error" borderRadius="control" bg="surfaceRaised">
              <AlertIcon />
              {error}
            </Alert>
          )}
          {result && (
            <Alert status="success" borderRadius="control" bg="surfaceRaised">
              <AlertIcon />
              {result}
            </Alert>
          )}
          {!result && (
            <HStack flexWrap="wrap">
              <Button
                variant="primary"
                leftIcon={<Check size={15} />}
                isLoading={busy}
                onClick={() => respond("accept")}
              >
                Accept invitation
              </Button>
              <Button
                variant="secondary"
                leftIcon={<X size={15} />}
                isDisabled={busy}
                onClick={() => respond("reject")}
              >
                Decline
              </Button>
            </HStack>
          )}
          {result && (
            <Button
              variant="secondary"
              alignSelf="flex-start"
              onClick={() => navigate("/dashboard")}
            >
              Go to workspace
            </Button>
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
