import { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Save, UserRound } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

export default function ProfilePage() {
  const { profile, profileError, refreshProfile } = useAuth();
  const [formState, setFormState] = useState(null);
  const profileId = profile?.uid || profile?.id || null;
  const form =
    formState?.profileId === profileId
      ? formState
      : {
          profileId,
          displayName: profile?.displayName || "",
          bio: profile?.bio || "",
        };
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.patch("/users/me", form);
      await refreshProfile();
      setNotice("Profile updated.");
    } catch (saveError) {
      setError(saveError.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack align="stretch" spacing={6} maxW="800px" mx="auto">
      <Box>
        <Text
          color="textMuted"
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.12em"
          textTransform="uppercase"
        >
          Account
        </Text>
        <Heading mt={2} fontSize={{ base: "2xl", md: "3xl" }}>
          Your profile
        </Heading>
        <Text mt={2} color="textSecondary">
          Keep your identity and team details up to date.
        </Text>
      </Box>

      {(error || profileError) && (
        <Alert status="error" borderRadius="control" bg="surface">
          <AlertIcon />
          {error || profileError}
        </Alert>
      )}
      {notice && (
        <Alert status="success" borderRadius="control" bg="surface">
          <AlertIcon />
          {notice}
        </Alert>
      )}

      <Card className="p-5 sm:p-6">
        <VStack align="stretch" spacing={5}>
          <Box display="flex" alignItems="center" gap={3}>
            <Box
              display="grid"
              placeItems="center"
              w="40px"
              h="40px"
              borderRadius="control"
              bg="accentSoft"
              color="accent"
            >
              <UserRound size={18} />
            </Box>
            <Box>
              <Heading size="sm">Personal information</Heading>
              <Text mt={1} color="textMuted" fontSize="xs">
                Your email is managed by Firebase Authentication.
              </Text>
            </Box>
          </Box>
          <form onSubmit={handleSubmit}>
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Display name</FormLabel>
                <Input
                  value={form.displayName}
                  onChange={(event) =>
                    setFormState({
                      ...form,
                      displayName: event.target.value,
                    })
                  }
                  minLength={1}
                  maxLength={100}
                  autoComplete="name"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Email address</FormLabel>
                <Input value={profile?.email || ""} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">About you</FormLabel>
                <Textarea
                  value={form.bio}
                  onChange={(event) =>
                    setFormState({
                      ...form,
                      bio: event.target.value,
                    })
                  }
                  maxLength={500}
                  placeholder="A short introduction for your teammates"
                  resize="vertical"
                />
              </FormControl>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save size={15} />}
                isLoading={saving}
                alignSelf="flex-start"
                px={5}
                minH="40px"
              >
                Save profile
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card>
    </VStack>
  );
}
