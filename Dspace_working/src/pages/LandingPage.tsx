import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  IconButton,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Psychology,
  Timeline,
  Speed,
  ArrowForward,
  GitHub,
  Analytics,
  Insights,
  MedicalServices
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <Psychology />,
      title: 'AI-Powered Analysis',
      description: 'Advanced reasoning with OpenAI O3 for comprehensive diagnostic assistance'
    },
    {
      icon: <Timeline />,
      title: 'Visual Flow Charts',
      description: 'Clear, linear visualization of diagnostic reasoning and medical concepts'
    },
    {
      icon: <Speed />,
      title: 'Instant Results',
      description: 'Sub-5-second analysis with real-time feedback and interactive exploration'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const handleLaunchApp = () => {
    navigate('/app');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Geometric Background Elements - Linear Style */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          background: `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.08)}, transparent)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
          zIndex: 0
        }}
      />

      {/* Header */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 3,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <MedicalServices sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: theme.palette.text.primary
                }}
              >
                Diagnosis-Space
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="v2.0"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 8, md: 12 },
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            <motion.div variants={itemVariants}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '32px', sm: '48px', md: '64px' },
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: '-1.5px',
                  color: theme.palette.text.primary,
                  mb: 3
                }}
              >
                AI-Powered
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'block'
                  }}
                >
                  Clinical Reasoning
                </Box>
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  mb: 4,
                  maxWidth: 600,
                  mx: 'auto'
                }}
              >
                Advanced diagnostic assistance for medical professionals using OpenAI O3
                and interactive visualization for comprehensive clinical decision support.
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 6 }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={handleLaunchApp}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                    }
                  }}
                >
                  Launch Diagnostic Platform
                </Button>
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, opacity: 0.7 }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, bgcolor: theme.palette.success.main, borderRadius: '50%' }} />
                  OpenAI O3 Ready
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, bgcolor: theme.palette.info.main, borderRadius: '50%' }} />
                  3D Visualization
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, bgcolor: theme.palette.warning.main, borderRadius: '50%' }} />
                  Research & Education
                </Typography>
              </Box>
            </motion.div>
          </Box>
        </motion.div>

        {/* Features Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Box sx={{ py: 8 }}>
            <motion.div variants={itemVariants}>
              <Typography
                variant="h3"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  letterSpacing: '-0.5px',
                  mb: 6,
                  color: theme.palette.text.primary
                }}
              >
                Built for Medical Excellence
              </Typography>
            </motion.div>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 4
              }}
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card
                    sx={{
                      height: '100%',
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3
                        }}
                      >
                        {React.cloneElement(feature.icon, {
                          sx: { fontSize: 28, color: theme.palette.primary.main }
                        })}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          color: theme.palette.text.primary
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.text.secondary,
                          lineHeight: 1.6
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Box
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              py: 4,
              textAlign: 'center'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mb: 2
              }}
            >
              ⚠️ For Research & Education Only • Not for Clinical Diagnosis
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.7)
              }}
            >
              Built with ❤️ for Healthcare Innovation • Version 2.0.0
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LandingPage;